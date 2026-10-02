<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__.'/../../includes/staff/auth.php';
require_once __DIR__.'/../../includes/staff/webauthn.php';

try {
    try {
        staff_db()->query("SELECT 1 FROM staff_passkeys LIMIT 1");
    } catch (PDOException $e) {
        throw new RuntimeException(
            'Passkey sign-in is not installed yet. Ask an administrator to run setup/install-passkeys.php.'
        );
    }

    $challenge=webauthn_random_challenge();

    $_SESSION['webauthn_auth_challenge']=$challenge;
    $_SESSION['webauthn_auth_time']=time();

    echo json_encode([
        'ok'=>true,
        'publicKey'=>[
            'challenge'=>$challenge,
            'rpId'=>webauthn_rp_id(),
            'timeout'=>60000,
            'userVerification'=>'preferred'
        ]
    ]);
} catch(Throwable $e) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'message'=>$e->getMessage()]);
}
