<?php
/**
 * Homepage portfolio feed.
 * Project images are discovered from assets/images/portfolio/<project folder>/.
 * A file named cover.jpg (or another supported cover.* extension) always wins.
 * Otherwise the named storefront/front-view/venue candidates are preferred.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');

$portfolioRoot = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'portfolio';
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

$projects = [
    [
        'id' => 'cafe-shop-at-hartamas',
        'folder' => 'Cafe Shop at Hartamas',
        'title' => 'Cafe Shop at Hartamas',
        'category' => 'Café & Retail',
        'location' => 'Hartamas',
        'description' => 'A café environment designed around a welcoming storefront, a comfortable customer journey and a warm, cohesive interior experience.',
        'coverCandidates' => ['Storefront.png', 'Storefront.jpg', 'Storefront.webp', 'Cafe Shop at Hartamas.png', 'Cafe Interior.png']
    ],
    [
        'id' => 'concorde-shah-alam',
        'folder' => 'Concorde, Shah Alam',
        'title' => 'Concorde Hotel',
        'category' => 'Hospitality',
        'location' => 'Shah Alam',
        'description' => 'A hospitality project featuring guest-room, corridor and lounge spaces, brought together through a consistent material and lighting language.',
        'coverCandidates' => ['Front View.jpg', 'Front View.png', 'Concorde Hotel.png', 'Concorde, Shah Alam.png', 'Concorde Twin Room.png']
    ],
    [
        'id' => 'free-duty-shop-klia-2',
        'folder' => 'Free Duty Shop at KLIA 2',
        'title' => 'Free Duty Shop',
        'category' => 'Airport Retail',
        'location' => 'KLIA 2',
        'description' => 'An airport retail environment designed to make product displays clear, approachable and easy to navigate in a busy travel setting.',
        'coverCandidates' => ['Duty Free.png', 'Duty Free.jpg', 'Free Duty Shop at KLIA 2.png', 'Storefront.png', 'Showroom.png']
    ],
    [
        'id' => 'getthis-cyberjaya',
        'folder' => 'Getthis Cyberjaya',
        'title' => 'Getthis Cyberjaya',
        'category' => 'Commercial Interior',
        'location' => 'Cyberjaya',
        'description' => 'A commercial interior project focused on a clear customer experience, practical circulation and a cohesive visual identity throughout the space.',
        'coverCandidates' => ['Storefront.png', 'Front View.png', 'Getthis Cyberjaya.png', 'Retail Showroom.png']
    ],
    [
        'id' => 'kilang-yakult',
        'folder' => 'Kilang Yakult',
        'title' => 'Kilang Yakult',
        'category' => 'Industrial Facility',
        'location' => '',
        'description' => 'A facility project bringing together workplace, briefing and shared-use spaces in a coordinated environment.',
        'coverCandidates' => ['Kilang Yakult.png', 'Kilang Yakult.jpg', 'Front View.png']
    ],
    [
        'id' => 'klana-resort-seremban',
        'folder' => 'Klana Resort, Seremban',
        'title' => 'Klana Resort',
        'category' => 'Hospitality',
        'location' => 'Seremban',
        'description' => 'A resort project spanning public facilities and guest spaces, balancing a welcoming arrival with comfortable, considered interiors.',
        'coverCandidates' => ['Front View.png', 'Front View.jpg', 'Klana Resort.png', 'Klana Resort.jpg', 'Klana Resort, Seremban.png']
    ],
    [
        'id' => 'kooceng-cat-hotel-spa',
        'folder' => 'Kooceng Cat Hotel & Spa',
        'title' => 'Kooceng Cat Hotel & Spa',
        'category' => 'Retail & Hospitality',
        'location' => '',
        'description' => 'A specialist customer-facing environment shaped around practical display, welcoming service areas and carefully planned interior details.',
        'coverCandidates' => ['Storefront.png', 'Front View.png', 'Kooceng Cat Hotel & Spa.png', 'Kooceng.png']
    ],
    [
        'id' => 'masjid-dato-klana-petra-undang-luak-sungai-ujong',
        'folder' => "Masjid Dato' Klana Petra Undang Luak Sungai Ujong",
        'title' => "Masjid Dato' Klana Petra Undang Luak Sungai Ujong",
        'category' => 'Religious & Community',
        'location' => 'Seremban',
        'description' => 'A community and religious space highlighting the main hall, ablution facilities and architectural details that shape the visitor experience.',
        'coverCandidates' => ['Front View.png', "Masjid Dato' Klana Petra Undang Luak Sungai Ujong.png", 'Masjid Dato Klana.png', 'Masjid.png', 'Grand Hall.jpeg', 'Grand Hall.jpg']
    ],
    [
        'id' => 'naelofar-hijab',
        'folder' => 'Naelofar Hijab',
        'title' => 'Naelofar Hijab',
        'category' => 'Retail Boutique',
        'location' => '',
        'description' => 'A boutique retail interior with considered display zones, fitting areas and a storefront designed to make the brand immediately recognisable.',
        'coverCandidates' => ['Storefront.png', 'Storefront.jpg', 'Front View.png', 'Naelofar Hijab.png', 'Boutique Interior.png']
    ],
    [
        'id' => 'panggung-bangsawan-melaka',
        'folder' => 'Panggung Bangsawan Melaka',
        'title' => 'Panggung Bangsawan',
        'category' => 'Arts & Culture',
        'location' => 'Melaka',
        'description' => 'A performance and event venue featuring auditorium, ballroom and lobby spaces designed to create a strong arrival and audience experience.',
        'coverCandidates' => ['Panggung Bangsawan.png', 'Panggung Bangsawan.jpg', 'Front View.png', 'Lobby.png']
    ],
    [
        'id' => 'subang-jaya-medical-centre',
        'folder' => 'Subang Jaya Medical Centre',
        'title' => 'Subang Jaya Medical Centre',
        'category' => 'Healthcare',
        'location' => 'Subang Jaya',
        'description' => 'A healthcare facility project focused on a clear exterior identity and a professional, approachable visitor experience.',
        'coverCandidates' => ['Subang Jaya Medical Centre.png', 'Subang Jaya Medical Centre.jpg', 'Front View.png']
    ],
];

$makeUrl = static function (string $folder, string $filename): string {
    return 'assets/images/portfolio/' . rawurlencode($folder) . '/' . rawurlencode($filename);
};

foreach ($projects as &$project) {
    $folderPath = $portfolioRoot . DIRECTORY_SEPARATOR . $project['folder'];
    $files = [];

    if (is_dir($folderPath) && is_readable($folderPath)) {
        foreach (scandir($folderPath) ?: [] as $filename) {
            if ($filename === '.' || $filename === '..' || str_starts_with($filename, '.')) {
                continue;
            }
            $filePath = $folderPath . DIRECTORY_SEPARATOR . $filename;
            $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            if (is_file($filePath) && in_array($extension, $allowedExtensions, true)) {
                $files[] = $filename;
            }
        }
    }

    usort($files, 'strnatcasecmp');
    $cover = null;

    // A deliberately selected cover.jpg / cover.png takes first priority.
    foreach ($files as $filename) {
        $baseName = pathinfo($filename, PATHINFO_FILENAME);
        if (preg_match('/^cover(?:[ _.-].*)?$/i', $baseName)) {
            $cover = $filename;
            break;
        }
    }

    // Otherwise use the recognizable storefront, front-view or venue image names.
    if ($cover === null) {
        foreach ($project['coverCandidates'] as $candidate) {
            foreach ($files as $filename) {
                if (strcasecmp($filename, $candidate) === 0) {
                    $cover = $filename;
                    break 2;
                }
            }
        }
    }

    // Last-resort fallback: an exterior/storefront/front-view image, then first filename.
    if ($cover === null) {
        foreach ($files as $filename) {
            if (preg_match('/storefront|front[ _-]*view|exterior|facade|building|main[ _-]*entrance/i', $filename)) {
                $cover = $filename;
                break;
            }
        }
    }
    if ($cover === null && $files) {
        $cover = $files[0];
    }

    $orderedImages = [];
    if ($cover !== null) {
        $orderedImages[] = $cover;
    }
    foreach ($files as $filename) {
        if ($filename !== $cover) {
            $orderedImages[] = $filename;
        }
    }

    $project['cover'] = $cover !== null ? [
        'src' => $makeUrl($project['folder'], $cover),
        'name' => $cover
    ] : null;
    $project['images'] = array_map(static function (string $filename) use ($project, $makeUrl): array {
        return [
            'src' => $makeUrl($project['folder'], $filename),
            'name' => $filename
        ];
    }, $orderedImages);
    unset($project['folder'], $project['coverCandidates']);
}
unset($project);

echo json_encode(
    ['projects' => $projects],
    JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
);
