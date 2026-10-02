<?php
function db(): ?PDO {
    try {
        return new PDO(
            'mysql:host=localhost;dbname=ideare_db;charset=utf8mb4',
            'root',
            '',
            [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]
        );
    } catch (Throwable $e) { return null; }
}
