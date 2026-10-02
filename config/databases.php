<?php
declare(strict_types=1);

function customer_db(): ?PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    try {
        $pdo = new PDO(
            'mysql:host=localhost;dbname=ideare_db;charset=utf8mb4',
            'root',
            '',
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        return $pdo;
    } catch (Throwable $e) {
        return null;
    }
}

function staff_db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $pdo = new PDO(
        'mysql:host=localhost;dbname=ideare_db;charset=utf8mb4',
        'root',
        '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    return $pdo;
}
