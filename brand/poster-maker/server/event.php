<?php
/* Create a real Discord event with the poster as its cover (George 10 Nov).
   Needs the TR Tools bot in the server with "Create Events"/"Manage Events" and config 'discord_bot_token' (secret).
   Discord sign-in only, op id + same-content guard, 5 per hour. The event is "somewhere else" (external) with the
   place from the poster, so it works for FB Live, Zoom, Ortigas or a Discord stage link alike. */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/net.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') zt_json_fail(405, 'Method not allowed.', 'method');
$u = zt_user();
if (!$u) zt_json_fail(401, 'You were signed out. Nothing was created. Reload and sign in again.', 'signed_out');
if (!zt_csrf_ok($_POST['csrf'] ?? null)) zt_json_fail(400, 'This page expired. Nothing was created. Reload it and try again.', 'csrf');
if (($u['via'] ?? '') !== 'discord') zt_json_fail(403, 'Sign in with Discord to create Discord events.', 'discord_only');
$cfg = zt_config();
$token = (string)($cfg['discord_bot_token'] ?? '');
if ($token === '') zt_json_fail(503, 'Discord events aren\'t switched on yet (the TR Tools bot isn\'t set up).', 'not_ready');

$name = trim(mb_substr((string)($_POST['name'] ?? ''), 0, 100));
$desc = trim(mb_substr((string)($_POST['description'] ?? ''), 0, 1000));
$where = trim(mb_substr((string)($_POST['location'] ?? ''), 0, 100));
if ($name === '' || $where === '') zt_json_fail(400, 'The event needs a title and a place (Details stage).');
$tz = new DateTimeZone('Asia/Manila');
$st = DateTimeImmutable::createFromFormat('Y-m-d\TH:i', (string)($_POST['start'] ?? ''), $tz);
$en = DateTimeImmutable::createFromFormat('Y-m-d\TH:i', (string)($_POST['end'] ?? ''), $tz);
if (!$st) zt_json_fail(400, 'The event needs a date and start time (Details stage).');
if ($st->getTimestamp() < zt_now() + 60) zt_json_fail(400, 'The start time has passed. Check the date and time.');
if (!$en || $en <= $st) $en = $st->modify('+1 hour');
if (!zt_rate('event:' . zt_user_key($u), 5, 3600)) zt_json_fail(429, 'That\'s 5 events this hour. Try again later.', 'slow');

$op = zt_op_id();
[$tmp, $mime, $fname] = zt_upload_file(8 * 1048576);
if (!in_array($mime, ['image/png', 'image/jpeg', 'image/gif'], true)) zt_json_fail(415, 'The event cover must be an image.');
$hash = hash('sha256', zt_user_key($u) . '|event|' . $name . '|' . $st->format('c'));
$prev = zt_op_reserve($op, $hash, ['to' => 'event', 'where' => 'Discord events', 'by' => (string)($u['name'] ?? ''), 'owner' => zt_user_key($u)]);
if ($prev) zt_op_repeat($prev, 'the Discord Events list');

$body = json_encode([
    'name' => $name, 'description' => $desc, 'privacy_level' => 2, 'entity_type' => 3,
    'entity_metadata' => ['location' => $where],
    'scheduled_start_time' => $st->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s\Z'),
    'scheduled_end_time' => $en->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s\Z'),
    'image' => 'data:' . $mime . ';base64,' . base64_encode((string)file_get_contents($tmp)),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$reason = rawurlencode(mb_substr((string)($u['name'] ?? '') . ' via TR Poster Maker', 0, 100));
[$code, $res] = zt_http('POST', $cfg['discord_api'] . '/guilds/' . rawurlencode((string)$cfg['guild_id']) . '/scheduled-events',
    ['Authorization: Bot ' . $token, 'Content-Type: application/json', 'X-Audit-Log-Reason: ' . $reason], $body);
if ($code < 200 || $code >= 300 || empty($res['id'])) {
    zt_log('event_fail', ['by' => $u['name'] ?? '', 'http' => $code]);
    if ($code >= 400 && $code < 500) { zt_op_finish($op, 'failed'); zt_json_fail(502, $code === 403 ? 'The TR Tools bot isn\'t allowed to create events. Nothing was created. Ask George to give it "Create Events".' : 'Discord didn\'t accept the event (error ' . $code . '). Nothing was created.', 'discord'); }
    zt_op_finish($op, 'unknown');
    zt_json_fail(504, 'We couldn\'t confirm whether Discord created the event. Check the Events list before trying again.', 'unknown');
}
$url = 'https://discord.com/events/' . rawurlencode((string)$cfg['guild_id']) . '/' . rawurlencode((string)$res['id']);
zt_op_finish($op, 'done', $url);
zt_log('event_created', ['by' => $u['name'] ?? '']);
echo json_encode(['ok' => true, 'url' => $url]);
