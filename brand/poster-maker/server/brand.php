<?php
/* Team brand kit (George 10 Nov): admins share colours, Google Fonts and uploaded font files with every Guild Leader.
   GET            → {colours, gfonts, fonts:[{id,name}]}   (any signed-in user)
   GET ?font=<id> → the font file                        (any signed-in user; files live in the private folder)
   POST JSON      → admins: add_colour / remove_colour / add_gfont / remove_gfont / remove_font
   POST multipart → admins: act=upload_font, name, file (.ttf .otf .woff .woff2, max 5 MB). Only fonts we own or free fonts. */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/net.php';

header('Cache-Control: no-store');
$u = zt_user();
if (!$u) zt_json_fail(401, 'Signed out.', 'signed_out');
function zt_font_dir(): string { $d = zt_private_dir() . '/data/fonts'; if (!is_dir($d)) @mkdir($d, 0700, true); return $d; }
function zt_brand(): array { $b = zt_read('brand'); return ['colours' => array_values($b['colours'] ?? []), 'gfonts' => array_values($b['gfonts'] ?? []), 'fonts' => array_values(array_map(fn($f) => ['id' => $f['id'], 'name' => $f['name']], $b['fonts'] ?? []))]; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['font'])) {
        $id = (string)$_GET['font'];
        $f = null; foreach (zt_read('brand')['fonts'] ?? [] as $x) if (($x['id'] ?? '') === $id) $f = $x;
        if (!$f || !preg_match('/^[a-f0-9]{16}$/', $id) || !is_file(zt_font_dir() . "/$id.bin")) { http_response_code(404); exit; }
        header('Content-Type: ' . ($f['mime'] ?? 'application/octet-stream'));
        header('Cache-Control: private, max-age=86400');
        readfile(zt_font_dir() . "/$id.bin"); exit;
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true] + zt_brand()); exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') zt_json_fail(405, 'Method not allowed.', 'method');
header('Content-Type: application/json; charset=utf-8');
$multipart = str_starts_with((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'multipart/');
$in = $multipart ? $_POST : zt_json_in();
if (!zt_csrf_ok($in['csrf'] ?? null)) zt_json_fail(400, 'This page expired. Reload it and try again.', 'csrf');
if (!zt_is_admin($u)) zt_json_fail(403, 'Only admins can change the team brand kit.', 'admins_only');
$act = (string)($in['act'] ?? '');
$by = (string)($u['name'] ?? '');

if ($act === 'upload_font') {
    $f = $_FILES['file'] ?? null;
    if (!$f || ($f['error'] ?? 1) !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) zt_json_fail(400, 'The font file didn\'t arrive.');
    if ($f['size'] > 5 * 1048576) zt_json_fail(413, 'That font file is over 5 MB.');
    $head = (string)file_get_contents($f['tmp_name'], false, null, 0, 4);
    $mime = ["\x00\x01\x00\x00" => 'font/ttf', 'true' => 'font/ttf', 'OTTO' => 'font/otf', 'wOFF' => 'font/woff', 'wOF2' => 'font/woff2'][$head] ?? null;
    if (!$mime) zt_json_fail(415, 'That isn\'t a .ttf, .otf, .woff or .woff2 font.');
    $name = trim(preg_replace('/[^A-Za-z0-9 _-]/', '', (string)($in['name'] ?? '')));
    $name = mb_substr($name !== '' ? $name : 'Team font', 0, 40);
    if (count(zt_read('brand')['fonts'] ?? []) >= 12) zt_json_fail(409, 'The team kit already has 12 fonts. Remove one on the Access page first.');
    $id = bin2hex(random_bytes(8));
    if (!move_uploaded_file($f['tmp_name'], zt_font_dir() . "/$id.bin")) zt_json_fail(500, 'Couldn\'t store the font. Try again.');
    @chmod(zt_font_dir() . "/$id.bin", 0600);
    zt_update('brand', function (array &$d) use ($id, $name, $mime, $by) { $d['fonts'] = array_values($d['fonts'] ?? []); $d['fonts'][] = ['id' => $id, 'name' => $name, 'mime' => $mime, 'by' => $by, 'at' => gmdate('c')]; });
} elseif ($act === 'add_colour' || $act === 'remove_colour') {
    $hex = strtoupper((string)($in['hex'] ?? ''));
    if (!preg_match('/^#[0-9A-F]{6}$/', $hex)) zt_json_fail(400, 'That isn\'t a HEX colour like #7DC4FA.');
    zt_update('brand', function (array &$d) use ($hex, $act) { $c = array_values(array_filter($d['colours'] ?? [], fn($x) => $x !== $hex)); if ($act === 'add_colour') array_unshift($c, $hex); $d['colours'] = array_slice($c, 0, 12); });
} elseif ($act === 'add_gfont' || $act === 'remove_gfont') {
    $name = trim(preg_replace('/[^A-Za-z0-9 ]/', '', (string)($in['name'] ?? '')));
    if ($name === '' || mb_strlen($name) > 40) zt_json_fail(400, 'That isn\'t a Google Font name.');
    zt_update('brand', function (array &$d) use ($name, $act) { $g = array_values(array_filter($d['gfonts'] ?? [], fn($x) => $x !== $name)); if ($act === 'add_gfont') array_unshift($g, $name); $d['gfonts'] = array_slice($g, 0, 12); });
} elseif ($act === 'remove_font') {
    $id = (string)($in['id'] ?? '');
    if (!preg_match('/^[a-f0-9]{16}$/', $id)) zt_json_fail(400, 'Unknown font.');
    zt_update('brand', function (array &$d) use ($id) { $d['fonts'] = array_values(array_filter($d['fonts'] ?? [], fn($x) => ($x['id'] ?? '') !== $id)); });
    @unlink(zt_font_dir() . "/$id.bin");
} else zt_json_fail(400, 'Unknown action.', 'bad_request');
zt_log('brand_' . $act, ['by' => $by]);
echo json_encode(['ok' => true] + zt_brand());
