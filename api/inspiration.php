<?php
/**
 * Public read-only inspiration feed for the IDEARE showroom.
 * Existing published designs are authoritative; extra photos and optional
 * descriptive metadata can be placed in assets/images/inspiration/<id>/.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, max-age=0');

try {
    require_once dirname(__DIR__) . '/includes/staff/feature-tools.php';
    $pdo = staff_db();
    $rows = db_rows(
        $pdo,
        'SELECT id, title, style_name, room_type, description, cover_image,
                base_design_id, is_featured
         FROM inspiration_designs
         WHERE is_published = 1
         ORDER BY is_featured DESC, sort_order ASC, created_at DESC
         LIMIT 150'
    );

    $items = [];
    $root = dirname(__DIR__);
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

    foreach ($rows as $row) {
        $id = (int) ($row['id'] ?? 0);
        if ($id < 1) {
            continue;
        }

        $folder = $root . '/assets/images/inspiration/' . $id;
        $photos = [];
        $seen = [];

        $coverPath = trim((string) ($row['cover_image'] ?? ''));
        if ($coverPath !== '' && !preg_match('~^(?:javascript|data):~i', $coverPath)) {
            // Preserve the existing upload URL convention from index.php.
            $url = ideare_root_url($coverPath);
            $photos[] = ['src' => $url, 'label' => 'Design overview'];
            $seen[$url] = true;
        }

        if (is_dir($folder)) {
            $names = scandir($folder);
            if (is_array($names)) {
                natcasesort($names);
                foreach ($names as $name) {
                    if ($name === '.' || $name === '..' || !is_file($folder . '/' . $name)) {
                        continue;
                    }
                    if (!in_array(strtolower((string) pathinfo($name, PATHINFO_EXTENSION)), $allowed, true)) {
                        continue;
                    }
                    $url = ideare_root_url('assets/images/inspiration/' . $id . '/' . rawurlencode($name));
                    if (isset($seen[$url])) {
                        continue;
                    }
                    $photos[] = [
                        'src' => $url,
                        'label' => trim(str_replace(['_', '-'], ' ', pathinfo($name, PATHINFO_FILENAME))),
                    ];
                    $seen[$url] = true;
                }
            }
        }

        // If the staff cover is empty, prefer an explicitly named cover image.
        if ($coverPath === '' && count($photos) > 1) {
            usort($photos, static function (array $a, array $b): int {
                $aCover = (int) (bool) preg_match('~/cover\.(?:jpg|jpeg|png|webp|avif)$~i', $a['src']);
                $bCover = (int) (bool) preg_match('~/cover\.(?:jpg|jpeg|png|webp|avif)$~i', $b['src']);
                return $bCover <=> $aCover;
            });
        }

        $metadata = [];
        $metadataPath = $folder . '/details.json';
        if (is_file($metadataPath) && filesize($metadataPath) < 16384) {
            $parsed = json_decode((string) file_get_contents($metadataPath), true);
            if (is_array($parsed)) {
                $metadata = $parsed;
            }
        }

        $cleanTags = static function ($candidate): array {
            if (!is_array($candidate)) {
                return [];
            }
            $tags = [];
            foreach (array_slice($candidate, 0, 8) as $tag) {
                if (is_string($tag) && trim($tag) !== '') {
                    $clean = trim($tag);
                    $tags[] = function_exists('mb_substr') ? mb_substr($clean, 0, 70) : substr($clean, 0, 210);
                }
            }
            return $tags;
        };

        $linkedId = (int) ($row['base_design_id'] ?? 0);
        $items[] = [
            'id' => $id,
            'title' => (string) ($row['title'] ?: 'Cabinet concept'),
            'style' => (string) ($row['style_name'] ?: 'IDEARE design'),
            'room' => (string) ($row['room_type'] ?: 'Custom cabinetry'),
            'description' => (string) ($row['description'] ?? ''),
            'featured' => (bool) ($row['is_featured'] ?? false),
            'cover' => $photos[0] ?? null,
            'photos' => $photos,
            'finishes' => $cleanTags($metadata['finishes'] ?? []),
            'features' => $cleanTags($metadata['features'] ?? []),
            'note' => is_string($metadata['note'] ?? null)
                ? (function_exists('mb_substr') ? mb_substr($metadata['note'], 0, 500) : substr($metadata['note'], 0, 1500))
                : '',
            'hasBaseDesign' => $linkedId > 0,
            'designerUrl' => ideare_root_url('designer/index.php' . ($linkedId > 0 ? '?design_id=' . $linkedId : '')),
        ];
    }

    echo json_encode(['projects' => $items], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR);
} catch (Throwable $exception) {
    http_response_code(503);
    error_log('IDEARE inspiration feed: ' . $exception->getMessage());
    echo json_encode(['error' => 'Inspirations are temporarily unavailable.']);
}
