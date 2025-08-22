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

// Status Alert functions - same document, different sheet
export async function addStatusAlertSubscriber(email: string, name: string) {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_NEWSLETTER_ID; // Same document as newsletter

    if (!spreadsheetId) {
      throw new Error('Google Sheets ID not configured');
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'StatusUpdate!A:C', // StatusUpdate sheet
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[name, email, '']], // name, email, sent (empty as you manage it)
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding status alert subscriber to Google Sheets:', error);
    return { success: false, error };
  }
}

export async function isStatusAlertSubscribed(email: string) {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_NEWSLETTER_ID; // Same document as newsletter

    if (!spreadsheetId) {
      throw new Error('Google Sheets ID not configured');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'StatusUpdate!B:B', // Email is in column B
    });

    const rows = response.data.values;
    if (!rows) {
      return { isSubscribed: false };
    }

    const isSubscribed = rows.some((row: string[]) => row[0] === email);
    return { isSubscribed };
  } catch (error) {
    console.error('Error checking status alert subscription status:', error);
    return { isSubscribed: false, error };
  }
}

export async function removeStatusAlertSubscriber(email: string) {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_NEWSLETTER_ID;

    if (!spreadsheetId) {
      throw new Error('Google Sheets ID not configured');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'StatusUpdate!B:B',
    });

    const rows = response.data.values;
    if (!rows) {
      return { success: false, message: 'No status alert subscribers found' };
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
      return { success: false, message: 'Email not found in status alert subscribers list' };
    }

    // Get the sheet ID for StatusUpdate sheet
    const sheetResponse = await sheets.spreadsheets.get({ spreadsheetId });
    const statusUpdateSheet = sheetResponse.data.sheets?.find(
      (sheet) => sheet.properties?.title === 'StatusUpdate',
    );
    const sheetId = statusUpdateSheet?.properties?.sheetId || 0;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
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
    console.error('Error removing status alert subscriber from Google Sheets:', error);
    return { success: false, error };
  }
}
