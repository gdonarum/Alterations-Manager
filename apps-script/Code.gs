// ─── Property Keys ────────────────────────────────────────────────────────────
const KEY_SS      = 'SPREADSHEET_ID';
const KEY_CAL     = 'CALENDAR_ID';
const KEY_TWILIO_SID   = 'TWILIO_ACCOUNT_SID';
const KEY_TWILIO_TOKEN = 'TWILIO_AUTH_TOKEN';
const KEY_TWILIO_PHONE = 'TWILIO_FROM_PHONE';
const KEY_SHOP_NAME    = 'SHOP_NAME';

// ─── Entry Point ──────────────────────────────────────────────────────────────
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Alterations Manager')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─── One-Time Setup ───────────────────────────────────────────────────────────
function setup() {
  const props = PropertiesService.getScriptProperties();

  // Create spreadsheet
  const ss = SpreadsheetApp.create('Alterations Manager');
  props.setProperty(KEY_SS, ss.getId());

  const customersSheet = ss.getActiveSheet();
  customersSheet.setName('Customers');
  customersSheet.appendRow(['ID', 'Name', 'Phone', 'Email', 'Notes', 'Created']);
  customersSheet.setFrozenRows(1);

  const jobsSheet = ss.insertSheet('Jobs');
  jobsSheet.appendRow([
    'Tag #', 'Date', 'Customer ID', 'Customer Name', 'Phone',
    'Description', 'Status', 'Paid $', 'Payment Method',
    'When Paid', 'Tip', 'Referred From', 'Referred By', 'Notes'
  ]);
  jobsSheet.setFrozenRows(1);

  const apptSheet = ss.insertSheet('Appointments');
  apptSheet.appendRow([
    'ID', 'Tag #', 'Customer Name', 'Date/Time',
    'Type', 'Notes', 'Calendar Event ID', 'Created'
  ]);
  apptSheet.setFrozenRows(1);

  // Create calendar
  const cal = CalendarApp.createCalendar('Alterations');
  props.setProperty(KEY_CAL, cal.getId());

  return { spreadsheetUrl: ss.getUrl(), calendarId: cal.getId() };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getSheet(name) {
  const ssId = PropertiesService.getScriptProperties().getProperty(KEY_SS);
  if (!ssId) return null;
  try {
    return SpreadsheetApp.openById(ssId).getSheetByName(name);
  } catch(e) {
    return null;
  }
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

// ─── Customers ────────────────────────────────────────────────────────────────
function getCustomers() {
  return sheetToObjects(getSheet('Customers'));
}

function addCustomer(data) {
  const sheet = getSheet('Customers');
  const id = Date.now().toString();
  sheet.appendRow([
    id,
    data.name,
    data.phone  || '',
    data.email  || '',
    data.notes  || '',
    new Date().toISOString()
  ]);
  return { id: id, name: data.name, phone: data.phone || '' };
}

function searchCustomers(query) {
  const q = query.toLowerCase();
  return getCustomers().filter(c =>
    String(c['Name']).toLowerCase().includes(q) ||
    String(c['Phone']).includes(q)
  );
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────
function getJobs() {
  return sheetToObjects(getSheet('Jobs'));
}

function getJob(tagNum) {
  return getJobs().find(j => String(j['Tag #']) === String(tagNum)) || null;
}

function addJob(data) {
  const sheet = getSheet('Jobs');
  sheet.appendRow([
    data.tagNumber,
    new Date().toISOString(),
    data.customerId   || '',
    data.customerName || '',
    data.phone        || '',
    data.description  || '',
    'in-progress',
    '', '', '', '',
    data.referredFrom || '',
    data.referredBy   || '',
    data.notes        || ''
  ]);
  return getJob(data.tagNumber);
}

function updateJob(tagNum, updates) {
  const sheet = getSheet('Jobs');
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rowIndex = data.findIndex((row, i) => i > 0 && String(row[0]) === String(tagNum));
  if (rowIndex === -1) return null;

  const colIndex = {};
  headers.forEach((h, i) => { colIndex[h] = i; });

  const fieldMap = {
    status:        'Status',
    paid:          'Paid $',
    paymentMethod: 'Payment Method',
    whenPaid:      'When Paid',
    tip:           'Tip',
    description:   'Description',
    notes:         'Notes',
    referredFrom:  'Referred From',
    referredBy:    'Referred By'
  };

  Object.entries(updates).forEach(([key, val]) => {
    const col = fieldMap[key];
    if (col !== undefined && colIndex[col] !== undefined) {
      sheet.getRange(rowIndex + 1, colIndex[col] + 1).setValue(val);
    }
  });

  return getJob(tagNum);
}

// ─── Appointments ─────────────────────────────────────────────────────────────
function getAppointmentsForJob(tagNum) {
  return sheetToObjects(getSheet('Appointments'))
    .filter(a => String(a['Tag #']) === String(tagNum))
    .sort((a, b) => new Date(a['Date/Time']) - new Date(b['Date/Time']));
}

function addAppointment(data) {
  const props  = PropertiesService.getScriptProperties();
  const calId  = props.getProperty(KEY_CAL);
  const sheet  = getSheet('Appointments');
  const id     = Date.now().toString();
  const start  = new Date(data.dateTime);
  const end    = new Date(start.getTime() + 60 * 60 * 1000);

  let calEventId = '';
  try {
    const cal   = CalendarApp.getCalendarById(calId);
    const title = 'Tag #' + data.tagNum + ' – ' + data.customerName + ' (' + data.type + ')';
    const event = cal.createEvent(title, start, end, { description: data.notes || '' });
    calEventId  = event.getId();
  } catch(e) {
    console.log('Calendar error:', e);
  }

  sheet.appendRow([
    id,
    data.tagNum,
    data.customerName,
    data.dateTime,
    data.type,
    data.notes     || '',
    calEventId,
    new Date().toISOString()
  ]);

  return { id: id, calEventId: calEventId };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function getDashboardData() {
  const jobs = getJobs();
  return {
    inProgress: jobs.filter(j => j['Status'] === 'in-progress'),
    ready:      jobs.filter(j => j['Status'] === 'ready'),
    pickedUp:   jobs.filter(j => j['Status'] === 'picked-up').slice(-10)
  };
}

// ─── SMS ──────────────────────────────────────────────────────────────────────
function sendReadyText(tagNum) {
  const job = getJob(tagNum);
  if (!job) return { success: false, error: 'Job not found' };

  const phone = job['Phone'];
  if (!phone) return { success: false, error: 'No phone number on file' };

  const props    = PropertiesService.getScriptProperties();
  const shopName = props.getProperty(KEY_SHOP_NAME) || 'the shop';
  const message  = 'Hi ' + job['Customer Name'] + '! Your alterations (tag #' + tagNum + ') are ready for pickup. Please contact ' + shopName + ' to arrange pickup. Thank you!';

  return sendSMS(phone, message);
}

function sendSMS(to, message) {
  const props = PropertiesService.getScriptProperties();
  const sid   = props.getProperty(KEY_TWILIO_SID);
  const token = props.getProperty(KEY_TWILIO_TOKEN);
  const from  = props.getProperty(KEY_TWILIO_PHONE);

  if (!sid || !token || !from) return { success: false, error: 'Twilio not configured. Go to Settings.' };

  try {
    const url     = 'https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json';
    const payload = 'From=' + encodeURIComponent(from) +
                    '&To='   + encodeURIComponent(to)   +
                    '&Body=' + encodeURIComponent(message);

    const response = UrlFetchApp.fetch(url, {
      method:  'post',
      headers: {
        'Authorization':  'Basic ' + Utilities.base64Encode(sid + ':' + token),
        'Content-Type':   'application/x-www-form-urlencoded'
      },
      payload:            payload,
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());
    return result.sid
      ? { success: true,  messageSid: result.sid }
      : { success: false, error: result.message };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function saveTwilioConfig(sid, token, phone) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(KEY_TWILIO_SID,   sid);
  props.setProperty(KEY_TWILIO_TOKEN, token);
  props.setProperty(KEY_TWILIO_PHONE, phone);
  return true;
}

function saveShopName(name) {
  PropertiesService.getScriptProperties().setProperty(KEY_SHOP_NAME, name);
  return true;
}

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    hasSpreadsheet: !!props.getProperty(KEY_SS),
    hasCalendar:    !!props.getProperty(KEY_CAL),
    hasTwilio:      !!(props.getProperty(KEY_TWILIO_SID) && props.getProperty(KEY_TWILIO_TOKEN))
  };
}
