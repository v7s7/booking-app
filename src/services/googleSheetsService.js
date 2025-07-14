import { google } from 'googleapis';
import credentials from '../../credentials.json'; // Path to your downloaded JSON

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_ID = '1m57ykJ2RZkPGTUgEfRgo9TIju0DKqFGko8xULxYn9a8'; // Get from your sheet URL

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES,
});

export const appendBooking = async ({ name, purpose, start, end, resource }) => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[name, purpose, start, end, resource]],
      },
    });
  } catch (err) {
    console.error('[Google Sheets Error]', err);
    throw err;
  }
};
