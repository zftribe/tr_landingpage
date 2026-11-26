<?php
/* Saved designs + team history. Any signed-in Guild Leader: save/open their own designs on any device,
   see the last 30 posters the team made (who, when, posted where), open or duplicate them. JSON in, JSON out.
   Designs hold settings and text only, never uploaded photos. */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/net.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$u = zt_user();
if (!$u) zt_json_fail(401, 'You were signed out. Reload the page and sign in again.', 'signed_out');
$me = zt_user_key($u);
const ZT_MAX_DESIGNS = 400;

/* keep only known fields with the right types and limits (designs are shared with the whole team) */
function zt_clean_design(array $d): ?array {
    $id = fn($v, $n = 40) => is_string($v) && preg_match('/^[a-z0-9-]{0,' . $n . '}$/', $v) ? $v : '';
    $str = fn($v, $n) => is_string($v) ? mb_substr($v, 0, $n) : '';
    $num = fn($v, $lo, $hi) => (is_int($v) || is_float($v)) && is_finite((float)$v) ? max($lo, min($hi, (float)$v)) : null;
    $out = ['tpl' => $id($d['tpl'] ?? '')];
    if ($out['tpl'] === '') return null;
    foreach (['style', 'theme', 'font', 'motion', 'grade', 'photoKey', 'size'] as $k) $out[$k] = $id($d[$k] ?? '');
    $out['custom'] = is_string($d['custom'] ?? null) && preg_match('/^#[0-9A-Fa-f]{6}$/', $d['custom']) ? strtoupper($d['custom']) : '';
    foreach (['titleFont', 'bodyFont'] as $k) $out[$k] = is_string($d[$k] ?? null) && preg_match('/^[A-Za-z0-9 _-]{0,40}$/', $d[$k]) ? $d[$k] : '';
    $out['titleWeight'] = in_array($d['titleWeight'] ?? 800, [400, 700, 800, 900], true) ? $d['titleWeight'] ?? 800 : 800;
    $f = is_array($d['f'] ?? null) ? $d['f'] : [];
    $lim = ['title' => 80, 'kicker' => 60, 'topic' => 220, 'where' => 60, 'channel' => 60, 'cta' => 80, 'link' => 200, 'partner' => 40, 'photoKey' => 40];
    $of = [];
    foreach ($lim as $k => $n) if (array_key_exists($k, $f)) $of[$k] = $str($f[$k], $n);
    foreach (['date' => '/^\d{4}-\d{2}-\d{2}$/', 'time' => '/^\d{2}:\d{2}$/', 'endTime' => '/^\d{2}:\d{2}$/'] as $k => $re) $of[$k] = is_string($f[$k] ?? null) && preg_match($re, $f[$k]) ? $f[$k] : '';
    $of['live'] = !empty($f['live']);
    foreach (['titleScale' => [0.7, 1.3], 'photoZoom' => [1, 3], 'focusX' => [0, 1], 'focusY' => [0, 1]] as $k => [$lo, $hi]) { $v = $num($f[$k] ?? null, $lo, $hi); if ($v !== null) $of[$k] = $v; }
    $sp = is_array($f['speakers'] ?? null) && array_is_list($f['speakers']) ? $f['speakers'] : [];
    $of['speakers'] = [];
    foreach (array_slice($sp, 0, 3) as $s) { if (!is_array($s)) continue; $row = ['name' => $str($s['name'] ?? '', 40), 'role' => $str($s['role'] ?? '', 40)]; $z = $num($s['zoom'] ?? null, 1, 2); if ($z !== null) $row['zoom'] = $z; $of['speakers'][] = $row; }
    $out['f'] = $of;
    return $out;
}

function zt_design_row(string $id, array $d, string $me): array {
    return ['id' => $id, 'name' => $d['name'] ?? '', 'by' => $d['by'] ?? '', 'at' => $d['at'] ?? '', 'tpl' => $d['tpl'] ?? '', 'date' => $d['date'] ?? '',
            'posted' => $d['posted'] ?? '', 'mine' => ($d['owner'] ?? '') === $me];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $all = zt_read('designs');
    if (isset($_GET['id'])) {
        $id = (string)$_GET['id'];
        if (!isset($all[$id])) zt_json_fail(404, 'That design was deleted.', 'not_found');
        echo json_encode(['ok' => true, 'design' => $all[$id]['design'] ?? []]); exit;
    }
    uasort($all, fn($a, $b) => strcmp($b['at'] ?? '', $a['at'] ?? ''));
    $mine = []; $team = [];
    foreach ($all as $id => $d) {
        $row = zt_design_row((string)$id, $d, $me);
        if ($row['mine'] && empty($d['auto'])) $mine[] = $row;
        if (count($team) < 30) $team[] = $row;
    }
    echo json_encode(['ok' => true, 'mine' => array_slice($mine, 0, 60), 'team' => $team]); exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') zt_json_fail(405, 'Method not allowed.', 'method');
$in = zt_json_in();
if (!zt_csrf_ok($in['csrf'] ?? null)) zt_json_fail(400, 'This page expired. Reload it and try again.', 'csrf');
$act = (string)($in['act'] ?? '');

if ($act === 'save') {
    if (!zt_rate('design:' . $me, 120, 3600)) zt_json_fail(429, 'Too many saves in an hour. Try again later.', 'slow');
    $design = $in['design'] ?? null;
    if (!is_array($design) || !preg_match('/^[a-z0-9-]{2,40}$/', (string)($design['tpl'] ?? ''))) zt_json_fail(400, 'That design looks broken.', 'bad_request');
    $design = zt_clean_design($design);
    if (!$design) zt_json_fail(400, 'That design looks broken.', 'bad_request');
    $raw = json_encode($design);
    if ($raw === false || strlen($raw) > 60000) zt_json_fail(413, 'That design is too big to save.', 'too_big');
    $id = is_string($in['id'] ?? null) && preg_match('/^[a-f0-9]{16}$/', $in['id']) ? $in['id'] : null;
    $name = trim(mb_substr((string)($in['name'] ?? ''), 0, 60)) ?: 'Untitled';
    $auto = !empty($in['auto']);
    $out = zt_update('designs', function (array &$all) use ($id, $design, $name, $auto, $u, $me) {
        if ($id === null || !isset($all[$id]) || ($all[$id]['owner'] ?? '') !== $me) $id = bin2hex(random_bytes(8));
        $prev = $all[$id] ?? [];
        $all[$id] = ['owner' => $me, 'by' => (string)($u['name'] ?? $u['email'] ?? ''), 'at' => gmdate('c'), 'name' => $name,
                     'tpl' => (string)$design['tpl'], 'date' => preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($design['f']['date'] ?? '')) ? $design['f']['date'] : '',
                     // auto = only made or posted (team history); a press of "Save design" makes it a named design in My designs
                     'auto' => $auto && empty($prev['named']), 'named' => !$auto || !empty($prev['named']),
                     'posted' => $prev['posted'] ?? '', 'design' => $design];
        if (count($all) > ZT_MAX_DESIGNS) { uasort($all, fn($a, $b) => strcmp($a['at'] ?? '', $b['at'] ?? '')); $all = array_slice($all, count($all) - ZT_MAX_DESIGNS, null, true); }
        return $id;
    });
    echo json_encode(['ok' => true, 'id' => $out]); exit;
}
$id = (string)($in['id'] ?? '');
if (!preg_match('/^[a-f0-9]{16}$/', $id)) zt_json_fail(400, 'Unknown design.', 'bad_request');
if ($act === 'delete') {
    $ok = zt_update('designs', function (array &$all) use ($id, $me, $u) {
        if (!isset($all[$id])) return true;
        if (($all[$id]['owner'] ?? '') !== $me && !zt_is_admin($u)) return false;
        unset($all[$id]); return true;
    });
    if (!$ok) zt_json_fail(403, 'You can only delete your own designs.', 'not_yours');
    echo '{"ok":true}'; exit;
}
if ($act === 'posted') {
    $where = mb_substr(preg_replace('/[^\p{L}\p{N} #_.-]/u', '', (string)($in['where'] ?? '')), 0, 40);
    zt_update('designs', function (array &$all) use ($id, $me, $where) { if (isset($all[$id]) && ($all[$id]['owner'] ?? '') === $me) { $p = array_filter(explode(', ', $all[$id]['posted'] ?? '')); if (!in_array($where, $p, true)) $p[] = $where; $all[$id]['posted'] = implode(', ', $p); } });
    echo '{"ok":true}'; exit;
}
zt_json_fail(400, 'Unknown action.', 'bad_request');
