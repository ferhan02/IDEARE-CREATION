<?php
// CLI only. Public API checks project embed availability, NOT white-label visitor/editor rights.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$hash = trim((string)getenv('P5D_PROJECT_HASH'));
$token = trim((string)getenv('P5D_API_TOKEN'));
if ($token === '' || preg_match('/[\r\n]/', $token) || !preg_match('/^[A-Za-z0-9_-]{1,150}$/D', $hash)) {
    fwrite(STDERR, "Set P5D_API_TOKEN and P5D_PROJECT_HASH in the shell environment.\n"); exit(1);
}
if (!function_exists('curl_init')) { fwrite(STDERR, "Enable PHP cURL.\n"); exit(1); }
$ch = curl_init('https://planner5d.com/api/public/projects/'.rawurlencode($hash).'/embedded-links');
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$token,'Accept: application/json'],CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>25,CURLOPT_FOLLOWLOCATION=>false]);
$body = curl_exec($ch); $code = curl_getinfo($ch,CURLINFO_HTTP_CODE); curl_close($ch);
if (!is_string($body) || $code < 200 || $code >= 300) { fwrite(STDERR,"Planner 5D request unsuccessful (HTTP $code). Check permissions, project hash and connectivity.\n"); exit(1); }
$decoded = json_decode($body,true);
if (!is_array($decoded)) { fwrite(STDERR,"Expected a JSON response.\n"); exit(1); }
// Deliberately do not render or publish raw vendor iframe HTML or URLs.
print "Project embed endpoint responded successfully. Verify the returned 3D view and editing permissions in the official reference / console.\n";
print "Response fields: ".implode(', ', array_keys($decoded))."\n";
