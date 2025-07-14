const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 4000;

// 🔐 Google Sheets Auth
const auth = new google.auth.GoogleAuth({
  keyFile: __dirname + '/service-account.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const SHEET_ID = '1m57ykJ2RZkPGTUgEfRgo9TIju0DKqFGko8xULxYn9a8';
const RANGE = 'Sheet1!A1';

// 🔥 Firebase Admin SDK
const firebaseServiceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(firebaseServiceAccount)
});

const db = admin.firestore();

// 📝 API: Save to Google Sheets & Firestore
app.post('/api/book', async (req, res) => {
  const { name, purpose, start, end, resource } = req.body;

  try {
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error('Invalid start or end time.');
    }

    // Save to Google Sheets
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          name,
          purpose,
          startTime.toLocaleDateString('en-GB'),
          startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          resource,
          new Date().toLocaleString('en-GB')
        ]]
      }
    });

    // Save to Firestore
    await db.collection('bookings').add({
      name,
      purpose,
      start: admin.firestore.Timestamp.fromDate(startTime),
      end: admin.firestore.Timestamp.fromDate(endTime),
      resource,
      timestamp: admin.firestore.Timestamp.now()
    });

    // ✅ Success
    res.status(200).send({ success: true });

  } catch (err) {
    console.error('[BOOKING ERROR]', err);
    res.status(500).send({ success: false, error: err.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
