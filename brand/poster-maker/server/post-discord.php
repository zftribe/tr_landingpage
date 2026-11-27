<?php
/* "Confirm and post" to Discord. Only Guild Leaders signed in WITH DISCORD, only to the channels George switched on
   (config 'discord_webhooks': channel name => webhook URL, a secret). Discord doesn't let apps post as a person,
   so the TR webhook posts it named "<name> via TR Poster Maker". Every post is logged. */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/net.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') zt_json_fail(405, 'Method not allowed.', 'method');
$u = zt_user();
if (!$u) zt_json_fail(401, 'You were signed out. Nothing was posted. Reload and sign in again.', 'signed_out');
if (!zt_csrf_ok($_POST['csrf'] ?? null)) zt_json_fail(400, 'This page expired. Nothing was posted. Reload it and try again.', 'csrf');
if (($u['via'] ?? '') !== 'discord') zt_json_fail(403, 'Sign in with Discord to post to Discord.', 'discord_only');
$cfg = zt_config();
$prefix = (string)($cfg['discord_webhook_base'] ?? 'https://discord.com/api/webhooks/');   // overridable only for local tests
$hooks = is_array($cfg['discord_webhooks'] ?? null) ? array_filter($cfg['discord_webhooks'], fn($v) => is_string($v) && str_starts_with($v, $prefix) && preg_match('#/\d+/[\w-]+$#', $v)) : [];
$channel = (string)($_POST['channel'] ?? '');
if (!isset($hooks[$channel])) zt_json_fail(400, 'That channel isn\'t switched on for posting.', 'channel');
$caption = trim((string)($_POST['caption'] ?? ''));
if (mb_strlen($caption) > 1900) zt_json_fail(400, 'The caption is too long for Discord (keep it under 1,900 characters).', 'caption');
if (!zt_rate('post-discord:' . zt_user_key($u), 10, 3600)) zt_json_fail(429, 'That\'s 10 posts this hour. Nothing was posted. Try again later.', 'slow');

$op = zt_op_id();
[$tmp, $mime, $fname] = zt_upload_file(10 * 1048576);
$hash = hash('sha256', zt_user_key($u) . '|discord|' . $channel . '|' . hash_file('sha256', $tmp) . '|' . $caption);
$prev = zt_op_reserve($op, $hash, ['to' => 'discord', 'where' => '#' . $channel, 'by' => (string)($u['name'] ?? ''), 'owner' => zt_user_key($u)]);
if ($prev) zt_op_repeat($prev, '#' . $channel);
$name = mb_substr(preg_replace('/discord|clyde|[@#:`]/i', '', (string)($u['name'] ?? 'Guild Leader')), 0, 50);
$payload = [
    'content' => $caption,
    'username' => trim($name) . ' via TR Poster Maker',
    'allowed_mentions' => ['parse' => !empty($cfg['discord_allow_everyone']) ? ['everyone'] : []],
    'attachments' => [['id' => 0, 'filename' => $fname]],
];
[$code, $res] = zt_http('POST', $hooks[$channel] . '?wait=true', [], [
    'payload_json' => json_encode($payload, JSON_UNESCAPED_UNICODE),
    'files[0]' => new CURLFile($tmp, $mime, $fname),
]);
if ($code < 200 || $code >= 300 || empty($res['id'])) {
    zt_log('post_discord_fail', ['user' => $u['id'] ?? '', 'channel' => $channel, 'http' => $code]);
    if ($code >= 400 && $code < 500) { zt_op_finish($op, 'failed'); zt_json_fail(502, 'Discord didn\'t accept the post (error ' . $code . '). Nothing was posted. Try again, or post it by hand.', 'discord'); }
    // no answer or a server error: Discord may still have posted it
    zt_op_finish($op, 'unknown');
    zt_json_fail(504, 'We couldn\'t confirm whether Discord posted it. Check #' . $channel . ' before trying again.', 'unknown');
}
$url = 'https://discord.com/channels/' . rawurlencode((string)$cfg['guild_id']) . '/' . rawurlencode((string)($res['channel_id'] ?? '')) . '/' . rawurlencode((string)$res['id']);
zt_op_finish($op, 'done', $url);
zt_log('post_discord', ['user' => $u['id'] ?? '', 'by' => $u['name'] ?? '', 'channel' => $channel]);
echo json_encode(['ok' => true, 'url' => $url]);
