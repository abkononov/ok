/**
 * Facebook Leads (Instant Form) -> Google Sheets -> Gmail forwarder.
 *
 * Setup:
 * 1. Open the Google Sheet where Facebook writes leads.
 * 2. Extensions -> Apps Script, replace Code.gs with this file.
 * 3. Edit CONFIG below (sheet/tab name, column headers, client mapping).
 * 4. Run checkForNewLeads once manually to grant Gmail/Sheets permission
 *    (grant access using the anton.kon.47@gmail.com account).
 * 5. Triggers (clock icon) -> Add trigger -> checkForNewLeads ->
 *    Time-driven -> Minutes timer -> Every 10 minutes.
 */

var CONFIG = {
  SHEET_NAME: 'Leads', // tab name that holds the Facebook leads

  // Header names exactly as they appear in row 1 of the sheet.
  COLUMNS: {
    fullName: 'full_name',
    email: 'email',
    phone: 'phone_number',
    formName: 'form_name',      // used to pick the client to forward to
    createdTime: 'created_time'
  },

  // Column the script uses to avoid sending the same lead twice.
  // Created automatically if it doesn't exist yet.
  STATUS_COLUMN: 'Отправлено',

  // form_name (or campaign_name) -> client email(s).
  // Add one entry per client/form. Multiple recipients: comma-separated string.
  CLIENT_MAP: {
    // 'Название формы в Facebook': 'client@example.com',
  },

  // Used when a lead's form isn't found in CLIENT_MAP, so nothing gets lost.
  FALLBACK_EMAIL: 'anton.kon.47@gmail.com',

  SUBJECT_PREFIX: 'Новый лид: '
};

function checkForNewLeads() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + CONFIG.SHEET_NAME + '" not found');

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return; // no data rows yet

  var headers = values[0];
  var col = {};
  Object.keys(CONFIG.COLUMNS).forEach(function (key) {
    col[key] = headers.indexOf(CONFIG.COLUMNS[key]);
  });

  var statusCol = headers.indexOf(CONFIG.STATUS_COLUMN);
  if (statusCol === -1) {
    statusCol = headers.length;
    sheet.getRange(1, statusCol + 1).setValue(CONFIG.STATUS_COLUMN);
  }

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (row[statusCol]) continue; // already processed

    try {
      var lead = {
        fullName: col.fullName > -1 ? row[col.fullName] : '',
        email: col.email > -1 ? row[col.email] : '',
        phone: col.phone > -1 ? row[col.phone] : '',
        formName: col.formName > -1 ? row[col.formName] : '',
        createdTime: col.createdTime > -1 ? row[col.createdTime] : ''
      };

      if (!lead.fullName && !lead.email && !lead.phone) continue; // empty row

      var recipient = CONFIG.CLIENT_MAP[lead.formName] || CONFIG.FALLBACK_EMAIL;
      var subject = CONFIG.SUBJECT_PREFIX + (lead.formName || 'Instant Form');
      var body = buildBody(lead);

      recipient.split(',').forEach(function (to) {
        GmailApp.sendEmail(to.trim(), subject, body);
      });

      sheet.getRange(r + 1, statusCol + 1).setValue(new Date());
    } catch (err) {
      sheet.getRange(r + 1, statusCol + 1).setValue('ОШИБКА: ' + err.message);
    }
  }
}

function buildBody(lead) {
  var lines = [
    'Имя: ' + lead.fullName,
    'Email: ' + lead.email,
    'Телефон: ' + lead.phone,
    'Форма: ' + lead.formName,
    'Время лида: ' + lead.createdTime,
    '',
    '— Отправлено автоматически из Google Sheets'
  ];
  return lines.join('\n');
}
