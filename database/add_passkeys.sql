USE ideare_db;

CREATE TABLE IF NOT EXISTS staff_passkeys (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    staff_id INT UNSIGNED NOT NULL,
    credential_id VARCHAR(512) NOT NULL,
    public_key_pem TEXT NOT NULL,
    sign_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
    label VARCHAR(120) NULL,
    transports VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME NULL,

    UNIQUE KEY uq_staff_passkey_credential (credential_id),
    KEY idx_staff_passkey_staff (staff_id),

    CONSTRAINT fk_staff_passkey_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff(id)
        ON DELETE CASCADE
);
