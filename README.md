# IdeaRE Staff Passkey Update

Copy these files into your existing project root:

`C:\xampp\htdocs\IDEARE CREATION\`

This package contains only the staff/auth update, not the customer website.

## What changes

- Login page still appears every time you sign out.
- It remembers only the last successful account name/email.
- It never stores the password itself in cookies or localStorage.
- Password fields use browser-standard autocomplete so the browser/password manager can offer saved passwords.
- Staff can register a real WebAuthn passkey from My Profile.
- Login can then be completed with Windows Hello / Windows Security or another passkey authenticator.

## Install

1. Back up your existing project.
2. Copy this ZIP's contents into `IDEARE CREATION`, allowing these files to be replaced:
   - `auth/login.php`
   - `includes/staff/auth.php`
   - `staff/pages/profile.php`
3. Add the new `auth/passkey/`, `includes/staff/webauthn.php`, and JS files.
4. In phpMyAdmin, run `database/add_passkeys.sql` while using `ideare_db`.
5. Open `assets/css/staff-passkey-patch.css`, copy its contents, and paste them at the bottom of your existing `assets/css/staff.css`.
6. Sign in normally.
7. Go to Staff Portal > My Profile > Passkeys > Add passkey.
8. Register Windows Hello.
9. Sign out and test `Sign in with a passkey` on the login page.

## Important

Passkeys require a secure browser context. `http://localhost` is treated as secure for local development, so XAMPP on localhost should work. A production domain must use HTTPS.

A passkey registered for `localhost` is scoped to localhost and will not automatically transfer to your future production domain.

This prototype supports ES256 WebAuthn credentials. For production, use a mature audited WebAuthn server library and conduct a security review.
