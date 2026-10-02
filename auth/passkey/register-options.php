<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__.'/../../includes/staff/auth.php';
require_once __DIR__.'/../../includes/staff/webauthn.php';
require_login();

try {
    $pdo=staff_db();

    try {
        $pdo->query("SELECT 1 FROM staff_passkeys LIMIT 1");
    } catch (PDOException $e) {
        throw new RuntimeException(
            'Passkey database support is not installed yet. Open setup/install-passkeys.php first.'
        );
    }

    $staff=current_staff();
    $challenge=webauthn_random_challenge();

    $_SESSION['webauthn_reg_challenge']=$challenge;
    $_SESSION['webauthn_reg_time']=time();

    $stmt=$pdo->prepare("SELECT credential_id FROM staff_passkeys WHERE staff_id=?");
    $stmt->execute([$staff['id']]);

    $exclude=array_map(
        fn($r)=>['type'=>'public-key','id'=>$r['credential_id']],
        $stmt->fetchAll()
    );

    $userId=b64url_encode(hash('sha256','ideare-staff:'.$staff['id'],true));

    echo json_encode([
        'ok'=>true,
        'publicKey'=>[
            'challenge'=>$challenge,
            'rp'=>[
                'name'=>'IdeaRE Staff Portal',
                'id'=>webauthn_rp_id()
            ],
            'user'=>[
                'id'=>$userId,
                'name'=>$staff['email'],
                'displayName'=>trim($staff['first_name'].' '.$staff['last_name'])
            ],
            'pubKeyCredParams'=>[
                ['type'=>'public-key','alg'=>-7]
            ],
            'timeout'=>60000,
            'attestation'=>'none',
            'authenticatorSelection'=>[
                'residentKey'=>'required',
                'requireResidentKey'=>true,
                'userVerification'=>'preferred'
            ],
            'excludeCredentials'=>$exclude
        ]
    ]);
} catch(Throwable $e) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'message'=>$e->getMessage()]);
}
