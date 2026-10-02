(() => {
  const btn = document.getElementById('passkeyLoginBtn');
  const status = document.getElementById('passkeyStatus');

  if (!btn) return;

  const root = window.IDEARE_ROOT || '';

  function fromB64url(value) {
    value = value.replace(/-/g, '+').replace(/_/g, '/');

    while (value.length % 4) {
      value += '=';
    }

    const raw = atob(value);

    return Uint8Array.from(
      raw,
      c => c.charCodeAt(0)
    );
  }

  function toB64url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    bytes.forEach(
      b => binary += String.fromCharCode(b)
    );

    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  function setLoading(loading) {
    btn.disabled = loading;
    btn.classList.toggle('is-loading', loading);
  }

  btn.addEventListener('click', async () => {
    if (!window.PublicKeyCredential || !navigator.credentials) {
      const message = 'This browser does not support passkeys/WebAuthn.';

      status.textContent = message;

      if (window.IdeaREAlert) {
        IdeaREAlert.error('Passkeys unavailable', message);
      }

      return;
    }

    setLoading(true);
    status.textContent = 'Waiting for your passkey…';

    try {
      const optionsRes = await fetch(
        root + '/auth/passkey/auth-options.php',
        { credentials: 'same-origin' }
      );

      const optionsData = await optionsRes.json();

      if (!optionsData.ok) {
        throw new Error(
          optionsData.message ||
          'Could not start passkey sign-in.'
        );
      }

      const publicKey = optionsData.publicKey;

      publicKey.challenge =
        fromB64url(publicKey.challenge);

      const credential =
        await navigator.credentials.get({
          publicKey
        });

      if (!credential) {
        throw new Error(
          'No passkey was selected.'
        );
      }

      const payload = {
        id: credential.id,
        rawId: toB64url(credential.rawId),
        type: credential.type,

        response: {
          clientDataJSON:
            toB64url(
              credential.response.clientDataJSON
            ),

          authenticatorData:
            toB64url(
              credential.response.authenticatorData
            ),

          signature:
            toB64url(
              credential.response.signature
            ),

          userHandle:
            credential.response.userHandle
              ? toB64url(
                  credential.response.userHandle
                )
              : null
        }
      };

      const verifyRes = await fetch(
        root + '/auth/passkey/auth-verify.php',
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await verifyRes.json();

      if (!result.ok) {
        throw new Error(
          result.message ||
          'Passkey sign-in failed.'
        );
      }

      status.textContent =
        'Passkey verified. Signing in…';

      window.location.href =
        result.redirect;

    } catch (err) {
      let message =
        err?.message ||
        'Passkey sign-in failed.';

      if (err?.name === 'NotAllowedError') {
        message =
          'Passkey sign-in was cancelled or timed out.';
      }

      status.textContent = message;

      if (
        window.IdeaREAlert &&
        err?.name !== 'NotAllowedError'
      ) {
        IdeaREAlert.error(
          'Passkey sign-in failed',
          message
        );
      }

    } finally {
      setLoading(false);
    }
  });
})();
