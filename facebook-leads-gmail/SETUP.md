# Facebook Leads → Gmail forwarder

Пересылает заявки из Instant Form (Facebook) на почту клиента. Источник данных — Google Sheets, куда лиды уже льются из Facebook. Никакого Meta App/webhook и паролей Gmail не требуется — скрипт работает изнутри вашего Google-аккаунта.

## Установка

1. Откройте вашу Google-таблицу с лидами (под аккаунтом `anton.kon.47@gmail.com`).
2. Расширения → Apps Script.
3. Вставьте содержимое `Code.gs` в редактор (замените стандартный `Code.gs`) и сохраните.
4. Запустите функцию `checkForNewLeads` вручную один раз (кнопка ▶ Run) — Google запросит доступ к Gmail и Sheets, подтвердите под `anton.kon.47@gmail.com`.
5. В редакторе слева — иконка часов (Triggers) → Add trigger → функция `checkForNewLeads` → Time-driven → Minutes timer → Every 10 minutes → Save.

`CONFIG` уже настроен под вашу таблицу:
- Колонки: `vollständiger_name` (имя), `telefonnummer` (телефон), плюс `form_name` / `campaign_name` / `ad_name` / `created_time` для контекста.
- Все заявки пересылаются на `Proteam.drivekoeln@gmail.com`.
- `SHEET_NAME` пустой → берётся первый лист таблицы. Если лидов несколько листов, впишите точное имя листа.

## Как это работает

- Каждые 10 минут скрипт проверяет новые строки в таблице.
- Каждую новую заявку отправляет письмом на `Proteam.drivekoeln@gmail.com`.
- Письмо уходит через `GmailApp` от имени `anton.kon.47@gmail.com`.
- Обработанные строки помечаются датой в колонке "Отправлено" (или текстом ошибки) — повторно не отправляются.

## Ограничения

- Лимит Gmail на отправку: ~100 писем/сутки для обычного аккаунта, 1500 — для Google Workspace.
- Проверьте, что заголовки колонок в `CONFIG.COLUMNS` совпадают с реальными в таблице (Facebook может называть их иначе в зависимости от способа интеграции — нативный экспорт, Zapier, Make и т.п.).
