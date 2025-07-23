import { google } from 'googleapis';

async function getGoogleSheetsClient() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    throw error;
  }
}

export async function addSubscriber(
  email: string,
  name: string,
  timestamp = new Date().toISOString(),
) {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_NEWSLETTER_ID;

    if (!spreadsheetId) {
      throw new Error('Google Sheets ID not configured');
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Subscribers!A:C',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[email, name, timestamp]],
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding subscriber to Google Sheets:', error);
    return { success: false, error };
  }
}

export async function isSubscribed(email: string) {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_NEWSLETTER_ID;

    if (!spreadsheetId) {
      throw new Error('Google Sheets ID not configured');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Subscribers!A:A',
    });

    const rows = response.data.values;
    if (!rows) {
      return { isSubscribed: false };
    }

    const isSubscribed = rows.some((row: string[]) => row[0] === email);
    return { isSubscribed };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { isSubscribed: false, error };
  }
}

export async function removeSubscriber(email: string) {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_NEWSLETTER_ID;

    if (!spreadsheetId) {
      throw new Error('Google Sheets ID not configured');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Subscribers!A:A',
    });

    const rows = response.data.values;
    if (!rows) {
      return { success: false, message: 'No subscribers found' };
    }

    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (Array.isArray(row) && row.length > 0 && row[0] === email) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, message: 'Email not found in subscribers list' };
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing subscriber from Google Sheets:', error);
    return { success: false, error };
  }
}
