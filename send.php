<?php
/**
 * send.php — приём заявок с сайта (квиз + форма консультации) и отправка на e-mail.
 * Работает на PHP-хостинге (Hetzner Webhosting S и т.п.).
 *
 * НАСТРОЙ ПЕРЕД ПУБЛИКАЦИЕЙ две строки ниже.
 */

// ── НАСТРОЙКИ ─────────────────────────────────────────────
$TO   = 'kontakt@ok-anfragen.de';   // куда приходят заявки — ВАШ почтовый ящик
$FROM = 'website@ok-anfragen.de';   // отправитель (адрес НА ВАШЕМ домене, создайте ящик в konsoleH)
$BRAND = 'O&K anfragen';
// ──────────────────────────────────────────────────────────

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// Принимаем JSON или обычные form-data
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { $data = $_POST; }

// Защита от заголовочных инъекций
function clean($v) { return trim(str_replace(["\r", "\n", "\0"], ' ', (string)$v)); }

// Honeypot: скрытое поле "company" люди не заполняют — если заполнено, это бот
if (!empty($data['company'])) { echo json_encode(['ok' => true]); exit; }

$type    = clean($data['type']    ?? 'Заявка');
$name    = clean($data['name']    ?? '');
$contact = clean($data['contact'] ?? ($data['email'] ?? ''));
$phone   = clean($data['phone']   ?? '');
$message = trim((string)($data['message'] ?? ''));

if ($name === '' || $contact === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Заполните имя и контакт.']);
    exit;
}

// Тело письма
$lines = [];
$lines[] = 'Тип заявки: ' . $type;
$lines[] = 'Имя: ' . $name;
$lines[] = 'Контакт: ' . $contact;
if ($phone !== '') $lines[] = 'Телефон: ' . $phone;

// Поля квиза (если есть)
$quizFields = ['budget' => 'Бюджет', 'urgency' => 'Срочность', 'experience' => 'Опыт рекламы'];
foreach ($quizFields as $key => $title) {
    if (!empty($data[$key])) $lines[] = $title . ': ' . clean($data[$key]);
}

if ($message !== '') { $lines[] = ''; $lines[] = 'Сообщение:'; $lines[] = $message; }
$lines[] = '';
$lines[] = '— Отправлено с сайта ' . ($_SERVER['HTTP_HOST'] ?? '') . ' (' . date('d.m.Y H:i') . ')';

$body = implode("\n", $lines);

// Тема (кириллицу кодируем в UTF-8 MIME)
$subjectText = $BRAND . ': ' . $type . ' — ' . $name;
$subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';

// Заголовки
$replyTo = (strpos($contact, '@') !== false) ? $contact : $FROM;
$fromName = '=?UTF-8?B?' . base64_encode($BRAND) . '?=';
$headers  = 'From: ' . $fromName . ' <' . $FROM . ">\r\n";
$headers .= 'Reply-To: ' . $replyTo . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";

$ok = @mail($TO, $subject, $body, $headers);

if ($ok) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Не удалось отправить. Попробуйте позже или напишите на e-mail.']);
}
