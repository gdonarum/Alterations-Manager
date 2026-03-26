import { google } from 'googleapis'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_REVENUE_ID

function getSheetsClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })
  return google.sheets({ version: 'v4', auth: oauth2Client })
}

export async function appendPaymentToSheet(
  accessToken: string,
  payment: {
    date: Date
    customerName: string
    amount: number
    method: string
    ticketNumbers: string[]
    notes?: string
  }
): Promise<void> {
  if (!SPREADSHEET_ID) {
    console.warn('GOOGLE_SHEETS_REVENUE_ID not set — skipping sheet sync')
    return
  }

  try {
    const sheets = getSheetsClient(accessToken)
    const row = [
      payment.date.toLocaleDateString('en-US'),
      payment.customerName,
      payment.amount.toFixed(2),
      payment.method,
      payment.ticketNumbers.join(', '),
      payment.notes || '',
    ]
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Revenue!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    })
  } catch (err) {
    console.error('Google Sheets append error:', err)
  }
}

export async function appendCustomerToSheet(
  accessToken: string,
  customer: { name: string; phone?: string; email?: string; contactMethod?: string }
): Promise<void> {
  if (!SPREADSHEET_ID) return

  try {
    const sheets = getSheetsClient(accessToken)
    const row = [
      new Date().toLocaleDateString('en-US'),
      customer.name,
      customer.phone || '',
      customer.email || '',
      customer.contactMethod || '',
    ]
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Customers!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    })
  } catch (err) {
    console.error('Google Sheets customer append error:', err)
  }
}
