<?php
/* Invites: admins (George) add or remove the email addresses allowed to sign in by email. */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/page.php';

$u = zt_user();
if (!$u) zt_redirect('./');
if (!zt_is_admin($u)) { http_response_code(403); zt_page('Not allowed', '<main class="wrap"><h1>Admins only</h1><p class="muted">Only George can manage invites.</p><a class="btn" href="./">Back to the Poster Maker</a></main>'); }

$note = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    zt_check_csrf();
    $act = $_POST['act'] ?? '';
    $email = zt_norm_email((string)($_POST['email'] ?? ''));
    if ($act === 'add') {
        $name = trim(mb_substr((string)($_POST['name'] ?? ''), 0, 80));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $note = '<div class="msg bad">That email address doesn\'t look right.</div>';
        else {
            zt_update('invites', function (array &$d) use ($email, $name, $u) { $d[$email] = ['name' => $name, 'added' => gmdate('c'), 'by' => $u['name'] ?? '', 'revoked' => false] + ($d[$email] ?? []); $d[$email]['revoked'] = false; if ($name !== '') $d[$email]['name'] = $name; });
            zt_log('invite_add', ['email' => $email, 'by' => $u['name'] ?? '']);
            $note = '<div class="msg ok">Invited ' . zt_h($email) . '. They can now use "Email me a sign-in link" on the sign-in page.</div>';
        }
    } elseif ($act === 'role_add') {
        $rid = trim((string)($_POST['role_id'] ?? ''));
        $label = trim(mb_substr((string)($_POST['role_label'] ?? ''), 0, 60));
        if (!preg_match('/^\d{17,20}$/', $rid)) $note = '<div class="msg bad">A role ID is a long number (17 to 20 digits). In Discord: Server Settings → Roles → right-click the role → Copy Role ID.</div>';
        else {
            zt_update('roles', function (array &$d) use ($rid, $label, $u) { $d[$rid] = ['label' => $label ?: 'Role ' . substr($rid, -4), 'added' => gmdate('c'), 'by' => $u['name'] ?? '', 'removed' => false]; });
            zt_log('role_add', ['role' => $rid, 'by' => $u['name'] ?? '']);
            $note = '<div class="msg ok">Members with the ' . zt_h($label ?: $rid) . ' role can now sign in with Discord.</div>';
        }
    } elseif ($act === 'role_remove') {
        $rid = (string)($_POST['role_id'] ?? '');
        zt_update('roles', function (array &$d) use ($rid) { if (isset($d[$rid])) $d[$rid]['removed'] = true; });
        zt_log('role_remove', ['role' => $rid, 'by' => $u['name'] ?? '']);
        $note = '<div class="msg ok">That role can no longer sign in. People already signed in keep access until their session ends (within 24 hours).</div>';
    } elseif (in_array($act, ['brand_colour', 'brand_gfont', 'brand_font'], true)) {
        $v = (string)($_POST['v'] ?? '');
        zt_update('brand', function (array &$d) use ($act, $v) {
            if ($act === 'brand_colour') $d['colours'] = array_values(array_filter($d['colours'] ?? [], fn($x) => $x !== $v));
            if ($act === 'brand_gfont') $d['gfonts'] = array_values(array_filter($d['gfonts'] ?? [], fn($x) => $x !== $v));
            if ($act === 'brand_font') $d['fonts'] = array_values(array_filter($d['fonts'] ?? [], fn($x) => ($x['id'] ?? '') !== $v));
        });
        if ($act === 'brand_font' && preg_match('/^[a-f0-9]{16}$/', $v)) @unlink(zt_private_dir() . "/data/fonts/$v.bin");
        $note = '<div class="msg ok">Removed from the team brand kit.</div>';
    } elseif ($act === 'photo_done') {
        $i = (int)($_POST['i'] ?? -1);
        zt_update('photo_requests', function (array &$d) use ($i) { if (isset($d[$i])) $d[$i]['done'] = true; });
        $note = '<div class="msg ok">Marked that photo request as done.</div>';
    } elseif ($act === 'revoke' || $act === 'restore') {
        zt_update('invites', function (array &$d) use ($email, $act) { if (isset($d[$email])) $d[$email]['revoked'] = $act === 'revoke'; });
        zt_log('invite_' . $act, ['email' => $email, 'by' => $u['name'] ?? '']);
        $note = '<div class="msg ok">' . ($act === 'revoke' ? 'Removed access for ' : 'Restored access for ') . zt_h($email) . '.</div>';
    }
}

$inv = zt_read('invites');
ksort($inv);
$rows = '';
foreach ($inv as $e => $r) {
    $e = (string)$e;
    $st = !empty($r['revoked']) ? '<span class="pill">Removed</span>' : '<span class="pill" style="border-color:#3ddc84;color:#3ddc84">Active</span>';
    $last = !empty($r['last']) ? zt_h(substr($r['last'], 0, 10)) : 'Never';
    $btn = !empty($r['revoked']) ? 'restore' : 'revoke';
    $rows .= '<tr><td>' . zt_h($r['name'] ?? '') . '</td><td>' . zt_h($e) . '</td><td>' . $st . '</td><td>' . $last . '</td><td><form method="post"><input type="hidden" name="csrf" value="' . zt_csrf() . '"><input type="hidden" name="act" value="' . $btn . '"><input type="hidden" name="email" value="' . zt_h($e) . '"><button class="linkbtn" type="submit">' . ($btn === 'revoke' ? 'Remove' : 'Restore') . '</button></form></td></tr>';
}
if ($rows === '') $rows = '<tr><td colspan="5" class="muted">No email invites yet. Guild Leaders can always sign in with Discord.</td></tr>';

$roleRows = '';
foreach (zt_allowed_roles() as $rid => $r) {
    $rid = (string)$rid;
    $act = $r['fixed'] ? '<span class="muted">Built in</span>' : '<form method="post"><input type="hidden" name="csrf" value="' . zt_csrf() . '"><input type="hidden" name="act" value="role_remove"><input type="hidden" name="role_id" value="' . zt_h($rid) . '"><button class="linkbtn" type="submit">Remove</button></form>';
    $roleRows .= '<tr><td>' . zt_h($r['label']) . '</td><td><code>' . zt_h($rid) . '</code></td><td>' . $act . '</td></tr>';
}

$log = array_reverse(array_slice(zt_read('log'), -30));
$logRows = '';
foreach ($log as $l) {
    if (!in_array($l['event'], ['signin_discord', 'signin_email', 'discord_denied', 'invite_add', 'invite_revoke', 'invite_restore', 'email_link_failed', 'role_add', 'role_remove', 'post_discord', 'post_discord_fail', 'post_fb', 'post_fb_fail', 'fb_connect', 'preset_save', 'photo_request', 'schedule_add', 'schedule_sent', 'schedule_failed', 'schedule_unknown', 'schedule_cancel', 'event_created', 'event_fail', 'brand_add_colour', 'brand_add_gfont', 'brand_upload_font'], true)) continue;
    $who = $l['by'] ?? ($l['email'] ?? ($l['user'] ?? ($l['role'] ?? '')));
    if (isset($l['channel'])) $who .= ' · #' . $l['channel'];
    $logRows .= '<tr><td>' . zt_h(str_replace('T', ' ', substr($l['at'], 0, 16))) . ' UTC</td><td>' . zt_h(str_replace('_', ' ', $l['event'])) . '</td><td>' . zt_h((string)$who) . '</td></tr>';
}
$reqRows = '';
foreach (array_reverse(zt_read('photo_requests'), true) as $i => $r) {
    if (!empty($r['done'])) continue;
    $reqRows .= '<tr><td>' . zt_h(substr((string)$r['at'], 0, 10)) . '</td><td>' . zt_h($r['by'] ?? '') . '</td><td>' . zt_h($r['tpl'] ?? '') . '</td><td>' . zt_h($r['note'] ?? '') . '</td><td><form method="post"><input type="hidden" name="csrf" value="' . zt_csrf() . '"><input type="hidden" name="act" value="photo_done"><input type="hidden" name="i" value="' . (int)$i . '"><button class="linkbtn" type="submit">Done</button></form></td></tr>';
}
if ($reqRows === '') $reqRows = '<tr><td colspan="5" class="muted">No open photo requests.</td></tr>';
$bk = zt_read('brand'); $kit = '';
$rm = fn($act, $v, $label) => '<form method="post" style="display:inline"><input type="hidden" name="csrf" value="' . zt_csrf() . '"><input type="hidden" name="act" value="' . $act . '"><input type="hidden" name="v" value="' . zt_h($v) . '"><button class="linkbtn" type="submit" aria-label="Remove ' . zt_h($label) . '">Remove</button></form>';
foreach ($bk['colours'] ?? [] as $c) $kit .= '<tr><td><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:' . zt_h($c) . ';vertical-align:middle"></span> ' . zt_h($c) . '</td><td>Colour</td><td>' . $rm('brand_colour', $c, $c) . '</td></tr>';
foreach ($bk['gfonts'] ?? [] as $g) $kit .= '<tr><td>' . zt_h($g) . '</td><td>Google Font</td><td>' . $rm('brand_gfont', $g, $g) . '</td></tr>';
foreach ($bk['fonts'] ?? [] as $f) $kit .= '<tr><td>' . zt_h($f['name'] ?? '') . '</td><td>Uploaded font (by ' . zt_h($f['by'] ?? '') . ')</td><td>' . $rm('brand_font', (string)($f['id'] ?? ''), (string)($f['name'] ?? '')) . '</td></tr>';
if ($kit === '') $kit = '<tr><td colspan="3" class="muted">Nothing shared yet. In the Look stage, use "Share with the team" on a colour or font.</td></tr>';
$sched = '';
foreach (zt_read('schedule') as $r) { if (($r['status'] ?? '') === 'cancelled' || ($r['at'] ?? 0) < zt_now() - 3 * 86400) continue;
    $sched .= '<tr><td>' . zt_h((new DateTimeImmutable('@' . (int)$r['at']))->setTimezone(new DateTimeZone('Asia/Manila'))->format('D M j, g:i A')) . ' PH</td><td>#' . zt_h($r['channel'] ?? '') . '</td><td>' . zt_h($r['by'] ?? '') . '</td><td>' . zt_h($r['status'] ?? '') . '</td></tr>'; }
if ($sched === '') $sched = '<tr><td colspan="4" class="muted">No scheduled posts.</td></tr>';
$cronOk = (zt_read('cron')['last'] ?? 0) > zt_now() - 1800 ? '<span style="color:#3ddc84">The server timer is running.</span>' : '<span style="color:#ffcf6b">The server timer (Cron Job) isn&#39;t running yet, so scheduled posts wait. See README: Cron Jobs, every 5 minutes.</span>';
$csrf = zt_csrf();
zt_page('Access · TR Poster Maker', <<<HTML
<main class="wrap wide">
  <div class="row" style="justify-content:space-between;align-items:center"><div style="flex:0 1 auto"><h1>Poster Maker <b>access</b></h1><p class="muted">Choose which Discord roles can sign in, and invite anyone else by email.</p></div><a class="btn" href="./" style="flex:0 0 auto;width:auto">Back to the Poster Maker</a></div>
  {$note}
  <section class="card"><h2>Discord roles that can sign in</h2>
    <p class="note">Anyone with one of these roles in Trading Republic gets in with "Sign in with Discord". To find a role ID: Discord → User Settings → Advanced → turn on Developer Mode, then Server Settings → Roles → right-click the role → Copy Role ID.</p>
    <div class="scroll"><table><thead><tr><th>Role</th><th>Role ID</th><th></th></tr></thead><tbody>{$roleRows}</tbody></table></div>
    <form method="post" class="row"><input type="hidden" name="csrf" value="{$csrf}"><input type="hidden" name="act" value="role_add">
      <div><label for="role_label">Role name</label><input type="text" id="role_label" name="role_label" placeholder="Moderators"></div>
      <div><label for="role_id">Role ID</label><input type="text" id="role_id" name="role_id" inputmode="numeric" placeholder="123456789012345678" required></div>
      <div style="flex:0 0 auto"><button class="btn gold" type="submit">Add role</button></div>
    </form>
  </section>
  <form method="post" class="card"><input type="hidden" name="csrf" value="{$csrf}"><input type="hidden" name="act" value="add">
    <h2>Invite by email</h2>
    <div class="row"><div><label for="name">Name</label><input type="text" id="name" name="name" placeholder="Steph Dycaico"></div><div><label for="email">Email</label><input type="email" id="email" name="email" required placeholder="name@example.com"></div><div style="flex:0 0 auto"><button class="btn gold" type="submit">Invite</button></div></div>
  </form>
  <section class="card"><h2>Email invites</h2><div class="scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Last sign-in</th><th></th></tr></thead><tbody>{$rows}</tbody></table></div></section>
  <section class="card"><h2>Team brand kit</h2><p class="muted">Colours and fonts every Guild Leader sees in the Look stage.</p><div class="scroll"><table><thead><tr><th>Item</th><th>Type</th><th></th></tr></thead><tbody>{$kit}</tbody></table></div></section>
  <section class="card"><h2>Scheduled Discord posts</h2><p class="muted">{$cronOk}</p><div class="scroll"><table><thead><tr><th>When</th><th>Channel</th><th>Who</th><th>Status</th></tr></thead><tbody>{$sched}</tbody></table></div></section>
  <section class="card"><h2>Photo requests</h2><p class="muted">Guild Leaders asked for these new backdrop photos (“Ask Codex for a new photo”). Claude hands them to Codex; press Done when the photo is in the library.</p><div class="scroll"><table><thead><tr><th>When</th><th>Who</th><th>Show</th><th>What</th><th></th></tr></thead><tbody>{$reqRows}</tbody></table></div></section>
  <section class="card"><h2>Recent activity</h2><div class="scroll"><table><thead><tr><th>When</th><th>What</th><th>Who</th></tr></thead><tbody>{$logRows}</tbody></table></div></section>
</main>
HTML);
