<?php
/** Vendor access is intentionally opt-in. Never store API secrets in this file. */
function ideare_p5d_embed_url(): ?string {
    // Confirm these with the partner team BEFORE enabling. The host page cannot enforce iframe UI restrictions.
    if (getenv('IDEARE_P5D_ENABLED') !== '1' || getenv('IDEARE_P5D_REQUIREMENTS_CONFIRMED') !== '1') return null;
    $url = trim((string)getenv('IDEARE_P5D_EMBED_URL'));
    if (!filter_var($url, FILTER_VALIDATE_URL)) return null;
    $parts = parse_url($url);
    $host = strtolower($parts['host'] ?? '');
    $approvedHost = strtolower(trim((string)getenv('IDEARE_P5D_APPROVED_HOST')));
    $trusted = $host === 'planner5d.com' || str_ends_with($host, '.planner5d.com') || ($approvedHost !== '' && $host === $approvedHost);
    if (!$trusted || ($parts['scheme'] ?? '') !== 'https' || isset($parts['user']) || isset($parts['pass']) || (isset($parts['port']) && $parts['port'] !== 443)) return null;
    // Bearer/API credentials must remain server-side; use only a vendor-issued browser embed URL.
    parse_str($parts['query'] ?? '', $params);
    foreach (array_keys($params) as $key) if (preg_match('/(?:api.?key|access.?token|bearer|password|secret|auth.?token)/i', $key)) return null;
    return $url;
}
