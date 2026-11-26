<?php
/* Scheduled Discord posts (George 10 Nov). Same rules as "Confirm and post" (Discord sign-in, allowed channels, op id),
   but the poster waits in the private folder and cron.php sends it at the chosen time (PH time, up to 30 days ahead).
   GET → my queued posts (admins: everyone's). POST multipart act=schedule; POST JSON act=cancel. */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/net.php';
require __DIR__ . '/lib/discord.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$u = zt_user();
if (!$u) zt_json_fail(401, 'You were signed out. Reload and sign in again.', 'signed_out');
$me = zt_user_key($u);
function zt_sched_dir(): string { $d = zt_private_dir() . '/data/sched'; if (!is_dir($d)) @mkdir($d, 0700, true); return $d; }
function zt_sched_rows(array $u, string $me): array {
    $out = [];
    foreach (zt_read('schedule') as $id => $r) {
        if (($r['owner'] ?? '') !== $me && !zt_is_admin($u)) continue;
        if (in_array($r['status'] ?? '', ['cancelled'], true) || ($r['at'] ?? 0) < zt_now() - 7 * 86400) continue;
        $out[] = ['id' => (string)$id, 'at' => (int)$r['at'], 'channel' => $r['channel'], 'by' => $r['by'], 'title' => $r['title'] ?? '', 'status' => $r['status'], 'url' => $r['url'] ?? '', 'mine' => ($r['owner'] ?? '') === $me];
    }
    usort($out, fn($a, $b) => $a['at'] <=> $b['at']);
    return $out;
}
function zt_cron_ok(): bool { $h = zt_read('cron'); return ($h['last'] ?? 0) > zt_now() - 1800; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') { echo json_encode(['ok' => true, 'items' => zt_sched_rows($u, $me), 'cron' => zt_cron_ok()]); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') zt_json_fail(405, 'Method not allowed.', 'method');
$multipart = str_starts_with((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'multipart/');
$in = $multipart ? $_POST : zt_json_in();
if (!zt_csrf_ok($in['csrf'] ?? null)) zt_json_fail(400, 'This page expired. Nothing was scheduled. Reload it and try again.', 'csrf');

if (($in['act'] ?? '') === 'cancel') {
    $id = (string)($in['id'] ?? '');
    $ok = zt_update('schedule', function (array &$d) use ($id, $me, $u) {
        if (!isset($d[$id]) || (($d[$id]['owner'] ?? '') !== $me && !zt_is_admin($u))) return 'nf';
        if (($d[$id]['status'] ?? '') !== 'queued') return 'late';
        $d[$id]['status'] = 'cancelled'; return 'ok';
    });
    if ($ok === 'nf') zt_json_fail(404, 'That scheduled post is gone.');
    if ($ok === 'late') zt_json_fail(409, 'Too late to cancel: it is already being sent or was sent.');
    @unlink(zt_sched_dir() . '/' . preg_replace('/[^a-f0-9]/', '', $id) . '.bin');
    zt_log('schedule_cancel', ['by' => $u['name'] ?? '']);
    echo json_encode(['ok' => true, 'items' => zt_sched_rows($u, $me)]); exit;
}

if (($u['via'] ?? '') !== 'discord') zt_json_fail(403, 'Sign in with Discord to post to Discord.', 'discord_only');
$channel = (string)($in['channel'] ?? '');
if (!isset(zt_webhooks()[$channel])) zt_json_fail(400, 'That channel isn\'t switched on for posting.', 'channel');
$caption = trim((string)($in['caption'] ?? ''));
if (mb_strlen($caption) > 1900) zt_json_fail(400, 'The caption is too long for Discord (keep it under 1,900 characters).', 'caption');
// "at" = local PH date-time from the page, e.g. 2026-11-11T15:00
$atIn = (string)($in['at'] ?? '');
$at = preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $atIn) ? (DateTimeImmutable::createFromFormat('Y-m-d\TH:i', $atIn, new DateTimeZone('Asia/Manila')) ?: null) : null;
if (!$at) zt_json_fail(400, 'Pick the date and time to post.');
$ts = $at->getTimestamp();
if ($ts < zt_now() + 120) zt_json_fail(400, 'Pick a time at least 2 minutes from now.');
if ($ts > zt_now() + 30 * 86400) zt_json_fail(400, 'You can schedule up to 30 days ahead.');
if (!zt_rate('schedule:' . $me, 20, 86400)) zt_json_fail(429, 'That\'s 20 scheduled posts today. Try again tomorrow.', 'slow');
$op = zt_op_id();
[$tmp, $mime, $fname] = zt_upload_file(10 * 1048576);
$title = mb_substr(trim((string)($in['title'] ?? '')), 0, 80);
$res = zt_update('schedule', function (array &$d) use ($op, $me, $u, $channel, $caption, $ts, $mime, $fname, $title) {
    foreach ($d as $k => $r) if (($r['at'] ?? 0) < zt_now() - 30 * 86400) unset($d[$k]);
    $id = substr(hash('sha256', $me . '|' . $op), 0, 16);
    if (isset($d[$id])) return [$id, false];
    $queued = count(array_filter($d, fn($r) => ($r['owner'] ?? '') === $me && ($r['status'] ?? '') === 'queued'));
    if ($queued >= 10) return [null, false];
    $d[$id] = ['owner' => $me, 'by' => (string)($u['name'] ?? ''), 'channel' => $channel, 'caption' => $caption, 'at' => $ts, 'mime' => $mime, 'fname' => $fname, 'title' => $title, 'status' => 'queued', 'made' => zt_now()];
    return [$id, true];
});
[$id, $new] = $res;
if ($id === null) zt_json_fail(429, 'You already have 10 posts waiting. Cancel one first.', 'full');
if ($new && !move_uploaded_file($tmp, zt_sched_dir() . "/$id.bin")) {
    zt_update('schedule', function (array &$d) use ($id) { unset($d[$id]); });
    zt_json_fail(500, 'Couldn\'t store the poster. Nothing was scheduled. Try again.');
}
@chmod(zt_sched_dir() . "/$id.bin", 0600);
zt_log('schedule_add', ['by' => $u['name'] ?? '', 'channel' => $channel]);
echo json_encode(['ok' => true, 'id' => $id, 'at' => $ts, 'cron' => zt_cron_ok(), 'items' => zt_sched_rows($u, $me)]);
