<?php

$pdo = new PDO(
    'mysql:host=localhost;dbname=ideare_db;charset=utf8mb4',
    'root',
    '',
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]
);

$hash = password_hash('123', PASSWORD_DEFAULT);

$stmt = $pdo->prepare("
    UPDATE staff
    SET password_hash = ?
");

$stmt->execute([$hash]);

echo "All staff passwords are now 123";