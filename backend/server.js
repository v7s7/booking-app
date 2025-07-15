const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 4000;

// 🔐 Google Sheets Auth
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'service-account.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const SHEET_ID = '1m57ykJ2RZkPGTUgEfRgo9TIju0DKqFGko8xULxYn9a8';
const RANGE = 'Sheet1!A:F';

// 🔥 Firebase Admin SDK
const firebaseServiceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(firebaseServiceAccount)
});

const db = admin.firestore();

// ✅ BOOKING endpoint
app.post('/api/book', async (req, res) => {
  const { name, email, purpose, start, end, resource, userId } = req.body;

  try {
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error('Invalid start or end time.');
    }

    console.log('[BOOKING REQUEST]', { name, email, purpose, start, end, resource, userId });

    // Save to Google Sheets
    try {
      const client = await auth.getClient();
      const sheets = google.sheets({ version: 'v4', auth: client });

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: RANGE,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            name,
            email,
            purpose,
            startTime.toLocaleDateString('en-GB'),
            startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            resource,
            new Date().toLocaleString('en-GB')
          ]]
        }
      });
    } catch (sheetErr) {
      console.warn('[GOOGLE SHEETS ERROR] Booking saved, but sheet failed:', sheetErr.message);
    }

    // Save to Firestore
    await db.collection('bookings').add({
      name,
      email,
      purpose,
      start: admin.firestore.Timestamp.fromDate(startTime),
      end: admin.firestore.Timestamp.fromDate(endTime),
      resource,
      userId,
      createdAt: admin.firestore.Timestamp.now()
    });

    console.log('[BOOKING SUCCESS]');
    res.status(200).send({ success: true });

  } catch (err) {
    console.error('[BOOKING ERROR]', err);
    res.status(500).send({ success: false, error: err.message || 'Unknown error' });
  }
});

// 🚫 Editing is now disabled — only delete is allowed
// Endpoint remains for potential future use
app.post('/api/update-booking', async (req, res) => {
  return res.status(403).send({ success: false, message: 'Editing is disabled.' });
});

// ✅ DELETE booking by ID
app.post('/api/delete-booking', async (req, res) => {
  const { id } = req.body;

  try {
    if (!id) {
      console.log('[DELETE ERROR] Missing ID in request.');
      return res.status(400).send({ success: false, message: 'Missing booking ID' });
    }

    const docRef = db.collection('bookings').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log('[DELETE ERROR] Booking not found for ID:', id);
      return res.status(404).send({ success: false, message: 'Booking not found' });
    }

    await docRef.delete();
    console.log('[DELETE SUCCESS] Booking deleted:', id);
    res.status(200).send({ success: true });

  } catch (err) {
    console.error('[DELETE ERROR]', err);
    res.status(500).send({ success: false, message: err.message || 'Delete failed' });
  }
});

// 🔄 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
