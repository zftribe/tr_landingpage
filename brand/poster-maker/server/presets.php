<?php
/* Team presets for the weekly shows ("Next Hunt" in one tap): admins save host, time, place, link, photo and look;
   the app fills in the next date for that weekday. Everyone signed in reads them (window.ZT.presets). */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/net.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$u = zt_user();
if (!$u) zt_json_fail(401, 'Signed out.', 'signed_out');
if ($_SERVER['REQUEST_METHOD'] === 'GET') { echo json_encode(['ok' => true, 'presets' => zt_read('presets')]); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') zt_json_fail(405, 'Method not allowed.', 'method');
$in = zt_json_in();
if (!zt_csrf_ok($in['csrf'] ?? null)) zt_json_fail(400, 'This page expired. Reload it and try again.', 'csrf');
if (!zt_is_admin($u)) zt_json_fail(403, 'Only admins can change team presets.', 'admins_only');
$tpl = (string)($in['tpl'] ?? '');
if (!preg_match('/^[a-z0-9-]{2,40}$/', $tpl)) zt_json_fail(400, 'Unknown template.', 'bad_request');

if (($in['act'] ?? '') === 'clear') {
    zt_update('presets', function (array &$d) use ($tpl) { unset($d[$tpl]); });
} elseif (($in['act'] ?? '') === 'save') {
    $p = $in['preset'] ?? null;
    if (!is_array($p) || !is_array($p['fields'] ?? null)) zt_json_fail(400, 'That preset looks broken.', 'bad_request');
    $keep = ['title', 'kicker', 'topic', 'time', 'endTime', 'where', 'channel', 'cta', 'partner', 'link', 'live', 'speakers'];
    $f = [];
    foreach ($keep as $k) if (array_key_exists($k, $p['fields'])) $f[$k] = $p['fields'][$k];
    $f['speakers'] = array_slice(array_map(fn($s) => ['name' => mb_substr((string)($s['name'] ?? ''), 0, 40), 'role' => mb_substr((string)($s['role'] ?? ''), 0, 40)], is_array($f['speakers'] ?? null) ? $f['speakers'] : []), 0, 3);
    foreach ($f as $k => $v) if (is_string($v)) $f[$k] = mb_substr($v, 0, 220);
    $row = ['fields' => $f, 'by' => (string)($u['name'] ?? ''), 'at' => gmdate('c')];
    if (isset($p['weekday']) && is_int($p['weekday']) && $p['weekday'] >= 0 && $p['weekday'] <= 6) $row['weekday'] = $p['weekday'];
    if (isset($p['nth']) && is_int($p['nth']) && $p['nth'] >= 1 && $p['nth'] <= 5) $row['nth'] = $p['nth'];   // e.g. 3rd Saturday of the month
    foreach (['photoKey', 'style', 'theme'] as $k) if (isset($p[$k]) && is_string($p[$k]) && preg_match('/^[a-z0-9-]{0,40}$/', $p[$k])) $row[$k] = $p[$k];
    if (strlen((string)json_encode($row)) > 8000) zt_json_fail(413, 'That preset is too big.', 'too_big');
    zt_update('presets', function (array &$d) use ($tpl, $row) { $d[$tpl] = $row; });
} else zt_json_fail(400, 'Unknown action.', 'bad_request');
zt_log('preset_' . ($in['act'] ?? ''), ['template' => $tpl, 'by' => $u['name'] ?? '']);
echo json_encode(['ok' => true, 'presets' => zt_read('presets')]);
