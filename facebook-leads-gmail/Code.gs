/**
 * Facebook Leads (Instant Form) -> Google Sheets -> Gmail forwarder.
 *
 * Sheet columns:
 * id, created_time, ad_id, ad_name, adset_id, adset_name, campaign_id,
 * campaign_name, form_id, form_name, is_organic, platform,
 * vollständiger_name, telefonnummer, lead_status
 *
 * Setup:
 * 1. Open the Google Sheet with the leads.
 * 2. Extensions -> Apps Script, paste this code instead of the default.
 * 3. Run checkForNewLeads once (Run button) and grant Gmail/Sheets access
 *    with the anton.kon.47@gmail.com account.
 * 4. Clock icon (Triggers) -> Add trigger -> checkForNewLeads ->
 *    Time-driven -> Minutes timer -> Every 10 minutes.
 */

var CONFIG = {
  // Sheet/tab name that holds the leads. Empty '' = first sheet.
  SHEET_NAME: 'list',

  // Header names exactly as in row 1 of the sheet.
  COLUMNS: {
    fullName: 'vollständiger_name',
    phone: 'telefonnummer',
    createdTime: 'created_time'
  },

  // Where all leads are forwarded.
  RECIPIENT: 'Proteam.drivekoeln@gmail.com',

  // Copy of every email (to monitor that the lead flow hasn't stopped).
  CC: 'ak@babymarketing.ru',

  // Marker column so the same lead isn't sent twice.
  STATUS_COLUMN: 'Sent',

  SUBJECT_PREFIX: 'New lead: '
};

function checkForNewLeads() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = CONFIG.SHEET_NAME ? ss.getSheetByName(CONFIG.SHEET_NAME) : ss.getSheets()[0];
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
        phone: col.phone > -1 ? row[col.phone] : '',
        createdTime: col.createdTime > -1 ? row[col.createdTime] : ''
      };

      if (!lead.fullName && !lead.phone) continue; // empty row

      var subject = CONFIG.SUBJECT_PREFIX + (lead.fullName || 'Instant Form');
      var options = CONFIG.CC ? { cc: CONFIG.CC } : {};
      GmailApp.sendEmail(CONFIG.RECIPIENT, subject, buildBody(lead), options);

      sheet.getRange(r + 1, statusCol + 1).setValue(new Date());
    } catch (err) {
      sheet.getRange(r + 1, statusCol + 1).setValue('ERROR: ' + err.message);
    }
  }
}

function buildBody(lead) {
  var lines = [
    'Name: ' + lead.fullName,
    'Phone number: ' + lead.phone,
    'Created time: ' + lead.createdTime
  ];
  return lines.join('\n');
}
