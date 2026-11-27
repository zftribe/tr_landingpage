<?php
/* Send mail through the zeefreaks.io mailbox over SMTP (config smtp_*), or PHP mail() when no SMTP is set. */
declare(strict_types=1);

function zt_send_mail(string $to, string $subject, string $text): bool {
    $cfg = zt_config();
    if ($sink = getenv('ZT_MAIL_SINK')) { return (bool)file_put_contents($sink, "TO: $to\nSUBJECT: $subject\n$text\n----\n", FILE_APPEND); } // local testing only
    $from = $cfg['mail_from']; $fromName = $cfg['mail_from_name'];
    $headers = [
        'From: ' . mb_encode_mimeheader($fromName) . " <$from>",
        'Reply-To: ' . $from,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ];
    if (empty($cfg['smtp_host'])) {
        return @mail($to, mb_encode_mimeheader($subject), $text, implode("\r\n", $headers), '-f' . $from);
    }
    return zt_smtp($cfg, $to, $subject, $text, $headers);
}

function zt_smtp(array $cfg, string $to, string $subject, string $text, array $headers): bool {
    $dom = substr(strrchr($cfg['mail_from'], '@') ?: '@zeefreaks.io', 1);
    $host = $cfg['smtp_host']; $port = (int)($cfg['smtp_port'] ?? 465);
    $remote = ($port === 465 ? 'ssl://' : 'tcp://') . $host . ':' . $port;
    $fp = @stream_socket_client($remote, $errno, $errstr, 12, STREAM_CLIENT_CONNECT, stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]));
    if (!$fp) return false;
    stream_set_timeout($fp, 12);
    $read = function () use ($fp) { $out = ''; while (($l = fgets($fp, 515)) !== false) { $out .= $l; if (isset($l[3]) && $l[3] === ' ') break; } return $out; };
    $cmd = function (string $c, array $ok) use ($fp, $read) { fwrite($fp, $c . "\r\n"); $r = $read(); return in_array((int)substr($r, 0, 3), $ok, true); };
    if ((int)substr($read(), 0, 3) !== 220) return false;
    if (!$cmd('EHLO ' . $dom, [250])) return false;
    if ($port === 587) { if (!$cmd('STARTTLS', [220])) return false; if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) return false; if (!$cmd('EHLO ' . $dom, [250])) return false; }
    if (!$cmd('AUTH LOGIN', [334]) || !$cmd(base64_encode($cfg['smtp_user']), [334]) || !$cmd(base64_encode($cfg['smtp_pass']), [235])) return false;
    if (!$cmd('MAIL FROM:<' . $cfg['mail_from'] . '>', [250]) || !$cmd('RCPT TO:<' . $to . '>', [250, 251]) || !$cmd('DATA', [354])) return false;
    $msg = implode("\r\n", array_merge($headers, ['To: <' . $to . '>', 'Subject: ' . mb_encode_mimeheader($subject), 'Date: ' . date('r'), 'Message-ID: <' . bin2hex(random_bytes(8)) . '@' . $dom . '>'])) . "\r\n\r\n";
    $body = preg_replace('/^\./m', '..', str_replace(["\r\n", "\n"], ["\n", "\r\n"], $text));
    fwrite($fp, $msg . $body . "\r\n.\r\n");
    $ok = (int)substr($read(), 0, 3) === 250;
    $cmd('QUIT', [221]); fclose($fp);
    return $ok;
}
