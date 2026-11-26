<?php
/* Sends scheduled Discord posts. Command line only (Hostinger Cron Jobs, every 5 minutes):
     /usr/bin/php /home/<user>/domains/georgeasibal.com/public_html/posters/cron.php
   From the web it answers 404 and does nothing. */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
if (empty($_SERVER['DOCUMENT_ROOT'])) $_SERVER['DOCUMENT_ROOT'] = realpath(__DIR__ . '/..');   // public_html, so zft-tools sits beside it
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/net.php';
require __DIR__ . '/lib/discord.php';

zt_update('cron', function (array &$d) { $d['last'] = zt_now(); });
$dir = zt_private_dir() . '/data/sched';
// claim what is due (at most 10 a run), so a slow run and the next one never send the same post
$due = zt_update('schedule', function (array &$d) {
    $out = [];
    foreach ($d as $id => $r) {
        if (($r['status'] ?? '') === 'sending' && ($r['claimed'] ?? 0) < zt_now() - 900) $d[$id]['status'] = 'unknown';   // a run died mid-send
        if (($r['status'] ?? '') !== 'queued' || ($r['at'] ?? PHP_INT_MAX) > zt_now() || count($out) >= 10) continue;
        $d[$id]['status'] = 'sending'; $d[$id]['claimed'] = zt_now(); $out[$id] = $d[$id];
    }
    return $out;
});
foreach ($due as $id => $r) {
    $path = "$dir/$id.bin";
    $status = 'failed'; $url = '';
    if (is_file($path)) {
        [$code, $res, $url] = zt_webhook_post((string)$r['channel'], (string)$r['caption'], $path, (string)$r['mime'], (string)$r['fname'], (string)$r['by']);
        $status = ($code >= 200 && $code < 300 && $url !== '') ? 'done' : (($code >= 400 && $code < 500) ? 'failed' : 'unknown');
        zt_log($status === 'done' ? 'schedule_sent' : 'schedule_' . $status, ['by' => $r['by'] ?? '', 'channel' => $r['channel'] ?? '', 'http' => $code]);
    }
    zt_update('schedule', function (array &$d) use ($id, $status, $url) { if (isset($d[$id])) { $d[$id]['status'] = $status; $d[$id]['url'] = $url; $d[$id]['sent'] = zt_now(); } });
    if ($status !== 'unknown') @unlink($path);
}
echo 'ok ' . count($due) . "\n";
