/**
 * Facebook Leads (Instant Form) -> Google Sheets -> Gmail forwarder.
 * Client: Tanzschule Osetrov.
 *
 * Setup:
 * 1. Open THIS client's Google Sheet with the leads.
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
    fullName: 'full_name',
    phone: 'phone_number',
    createdTime: 'created_time',
    livesNearCologne: 'wohnen_sie_in_oder_bei_köln?_unsere_schule_befindet_sich_in_bergisch_gladbach_in_der_nähe_von_köln._wenn_sie_weit_weg_wohnen,_senden_sie_uns_dieses_formular_nicht_zu.'
  },

  // Where all leads are forwarded.
  RECIPIENT: 'info@tanzschuleosetrov.de',

  // Copy of every email (to monitor that the lead flow hasn't stopped).
  CC: 'ak@babymarketing.ru',

  // Display name shown in the "From" field.
  SENDER_NAME: 'anton kononov',

  // Marker column so the same lead isn't sent twice.
  STATUS_COLUMN: 'Sent',

  SUBJECT: 'Instagram lead'
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
        createdTime: col.createdTime > -1 ? row[col.createdTime] : '',
        livesNearCologne: col.livesNearCologne > -1 ? row[col.livesNearCologne] : ''
      };

      if (!lead.fullName && !lead.phone) continue; // empty row

      var options = {};
      if (CONFIG.CC) options.cc = CONFIG.CC;
      if (CONFIG.SENDER_NAME) options.name = CONFIG.SENDER_NAME;
      GmailApp.sendEmail(CONFIG.RECIPIENT, CONFIG.SUBJECT, buildBody(lead), options);

      sheet.getRange(r + 1, statusCol + 1).setValue(new Date());
    } catch (err) {
      sheet.getRange(r + 1, statusCol + 1).setValue('ERROR: ' + err.message);
    }
  }
}

function buildBody(lead) {
  var lines = [
    'Vollständiger Name: ' + lead.fullName,
    'Telefonnummer: ' + lead.phone,
    'Date: ' + lead.createdTime,
    'Wohnen Sie in oder bei Köln?: ' + lead.livesNearCologne
  ];
  return lines.join('\n');
}
