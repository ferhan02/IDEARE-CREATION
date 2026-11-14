<?php
/**
 * IDEARE's read-only, folder-driven concept collection.
 * Does not depend on the staff inspiration database and does not replace it.
 * Images may be placed in assets/images/Concepts/<style>/ (preferred) or
 * Concepts/<style>/ at the website root (also supported).
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

$root = dirname(__DIR__);
$allowed = ['png', 'jpg', 'jpeg', 'webp', 'avif'];
$locations = [
    ['dir' => $root . '/assets/images/Concepts', 'url' => 'assets/images/Concepts'],
    ['dir' => $root . '/Concepts', 'url' => 'Concepts'],
];

$styles = [
    [
        'id' => 'japandi', 'name' => 'Japandi',
        'description' => 'A calm balance of warm timber, natural textures and understated simplicity.',
        'files' => [
            'Warm Japandi Kitchen Glow.png',
            'Warm Japandi Media Wall Retreat.png',
            'Warm Minimalist Oak Wardrobe Bedroom.png',
        ],
    ],
    [
        'id' => 'modern-contemporary', 'name' => 'Modern Contemporary',
        'description' => 'Refined cabinetry and expressive finishes for polished, modern spaces.',
        'files' => [
            'Warm Luxury Kitchen with Marble Island.png',
            'Warm Neutral Media Wall Living Room.png',
            'Warm Walnut Taupe Wardrobe Interior.png',
        ],
    ],
    [
        'id' => 'modern-minimalist', 'name' => 'Modern Minimalist',
        'description' => 'Clean lines, discreet storage and a quietly considered aesthetic.',
        'files' => [
            'Warm Minimalist Kitchen with Greenery.png',
            'Warm Minimalist Living Room Media Wall.png',
            'Warm Minimalist Bedroom Wardrobe Wall.png',
        ],
    ],
    [
        'id' => 'scandinavian', 'name' => 'Scandinavian',
        'description' => 'Light, welcoming interiors with natural wood and practical simplicity.',
        'files' => [
            'Scandinavian Kitchen with Natural Light.png',
            'Warm Scandinavian Living Room with TV Wall.png',
            'Warm Scandinavian Bedroom Wardrobe.png',
        ],
    ],
    [
        'id' => 'wabi-sabi', 'name' => 'Wabi Sabi',
        'description' => 'Organic warmth, earthy textures and beauty in natural variation.',
        'files' => [
            'Warm Wabi-Sabi Kitchen Interior.png',
            'Warm Wabi-Sabi Media Room.png',
            'Warm Wabi-Sabi Bedroom Wardrobe.png',
        ],
    ],
];

$roomFor = static function (string $name): string {
    if (preg_match('/kitchen/i', $name)) return 'Kitchen';
    if (preg_match('/wardrobe|bedroom/i', $name)) return 'Wardrobe';
    if (preg_match('/media|living|tv[ _-]*wall/i', $name)) return 'Media Wall';
    return 'Other';
};

$makeUrl = static function (string $base, string $style, string $file): string {
    return $base . '/' . rawurlencode($style) . '/' . rawurlencode($file);
};

$total = 0;
$available = 0;

foreach ($styles as &$style) {
    // Use an allowlisted list of project-owned style folders, never request parameters.
    $found = [];
    foreach ($locations as $location) {
        $folder = $location['dir'] . '/' . $style['name'];
        if (!is_dir($folder) || !is_readable($folder)) continue;
        $entries = scandir($folder);
        if (!is_array($entries)) continue;
        foreach ($entries as $entry) {
            if ($entry === '.' || $entry === '..' || str_starts_with($entry, '.')) continue;
            if (!is_file($folder . '/' . $entry)) continue;
            if (!in_array(strtolower(pathinfo($entry, PATHINFO_EXTENSION)), $allowed, true)) continue;
            $key = strtolower($entry);
            if (!array_key_exists($key, $found)) {
                $found[$key] = ['name' => $entry, 'src' => $makeUrl($location['url'], $style['name'], $entry)];
            }
        }
    }

    $items = [];
    foreach ($style['files'] as $expected) {
        $key = strtolower($expected);
        $actual = $found[$key] ?? null;
        unset($found[$key]);
        $items[] = [
            'id' => $style['id'] . '-' . substr(sha1($expected), 0, 12),
            'title' => pathinfo($expected, PATHINFO_FILENAME),
            'filename' => $expected,
            'room' => $roomFor($expected),
            'src' => $actual['src'] ?? null,
        ];
    }
    // Future files appear automatically without updating this manifest.
    uasort($found, static fn(array $a, array $b): int => strnatcasecmp($a['name'], $b['name']));
    foreach ($found as $entry) {
        // A cover.* image is reserved for the style card and isn't a concept.
        if (preg_match('/^cover\.(?:png|jpe?g|webp|avif)$/i', $entry['name'])) continue;
        $items[] = [
            'id' => $style['id'] . '-' . substr(sha1($entry['name']), 0, 12),
            'title' => trim(str_replace(['_', '-'], ' ', pathinfo($entry['name'], PATHINFO_FILENAME))),
            'filename' => $entry['name'],
            'room' => $roomFor($entry['name']),
            'src' => $entry['src'],
        ];
    }

    $styleCover = null;
    // Explicit cover file overrides the first kitchen image.
    foreach ($locations as $location) {
        $folder = $location['dir'] . '/' . $style['name'];
        if (!is_dir($folder)) continue;
        foreach (['cover.jpg', 'cover.jpeg', 'cover.png', 'cover.webp', 'cover.avif'] as $filename) {
            if (is_file($folder . '/' . $filename)) {
                $styleCover = $makeUrl($location['url'], $style['name'], $filename);
                break 2;
            }
        }
    }
    if ($styleCover === null) {
        foreach ($items as $item) {
            if ($item['src'] !== null && $item['room'] === 'Kitchen') {
                $styleCover = $item['src'];
                break;
            }
        }
    }
    if ($styleCover === null) {
        foreach ($items as $item) {
            if ($item['src'] !== null) {
                $styleCover = $item['src'];
                break;
            }
        }
    }

    $style['cover'] = $styleCover;
    $style['concepts'] = $items;
    $style['count'] = count($items);
    $style['availableImages'] = count(array_filter($items, static fn(array $item): bool => $item['src'] !== null));
    $total += $style['count'];
    $available += $style['availableImages'];
    unset($style['files']);
}
unset($style);

echo json_encode(
    ['styles' => $styles, 'totalConcepts' => $total, 'availableImages' => $available],
    JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
);
