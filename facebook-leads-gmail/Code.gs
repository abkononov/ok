/**
 * Facebook Leads (Instant Form) -> Google Sheets -> Gmail forwarder.
 *
 * Настроено под таблицу с колонками:
 * id, created_time, ad_id, ad_name, adset_id, adset_name, campaign_id,
 * campaign_name, form_id, form_name, is_organic, platform,
 * vollständiger_name, telefonnummer, lead_status
 *
 * Установка:
 * 1. Откройте вашу таблицу с лидами.
 * 2. Расширения -> Apps Script, вставьте этот код вместо стандартного.
 * 3. Запустите checkForNewLeads вручную один раз (кнопка Run) и выдайте
 *    доступ к Gmail/Sheets под аккаунтом anton.kon.47@gmail.com.
 * 4. Иконка часов (Triggers) -> Add trigger -> checkForNewLeads ->
 *    Time-driven -> Minutes timer -> Every 10 minutes.
 */

var CONFIG = {
  // Имя листа с лидами. Если оставить пустым '' — берётся первый лист.
  SHEET_NAME: '',

  // Заголовки колонок ровно как в первой строке таблицы.
  COLUMNS: {
    fullName: 'vollständiger_name',
    phone: 'telefonnummer',
    createdTime: 'created_time'
  },

  // Куда пересылать все заявки.
  RECIPIENT: 'Proteam.drivekoeln@gmail.com',

  // Колонка-отметка, чтобы не отправлять один лид дважды.
  // Создаётся автоматически, если её ещё нет.
  STATUS_COLUMN: 'Отправлено',

  SUBJECT_PREFIX: 'Новая заявка: '
};

function checkForNewLeads() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = CONFIG.SHEET_NAME ? ss.getSheetByName(CONFIG.SHEET_NAME) : ss.getSheets()[0];
  if (!sheet) throw new Error('Лист "' + CONFIG.SHEET_NAME + '" не найден');

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return; // ещё нет строк с данными

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
    if (row[statusCol]) continue; // уже обработана

    try {
      var lead = {
        fullName: col.fullName > -1 ? row[col.fullName] : '',
        phone: col.phone > -1 ? row[col.phone] : '',
        createdTime: col.createdTime > -1 ? row[col.createdTime] : ''
      };

      if (!lead.fullName && !lead.phone) continue; // пустая строка

      var subject = CONFIG.SUBJECT_PREFIX + (lead.fullName || 'Instant Form');
      GmailApp.sendEmail(CONFIG.RECIPIENT, subject, buildBody(lead));

      sheet.getRange(r + 1, statusCol + 1).setValue(new Date());
    } catch (err) {
      sheet.getRange(r + 1, statusCol + 1).setValue('ОШИБКА: ' + err.message);
    }
  }
}

function buildBody(lead) {
  var lines = [
    'Имя: ' + lead.fullName,
    'Номер телефона: ' + lead.phone,
    'Время создания: ' + lead.createdTime
  ];
  return lines.join('\n');
}
