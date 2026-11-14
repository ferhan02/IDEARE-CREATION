<?php
/**
 * Homepage portfolio feed.
 * Project images live in assets/images/Portfolio/{Design & Build|Property}/{project folder}/.
 * Images are discovered at runtime, so adding a supported image to a folder
 * automatically adds it to the corresponding project gallery.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');

$portfolioRoot = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'Portfolio';
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

$projects = [
    [
        'id' => 'cafe-shop-at-hartamas',
        'folder' => 'Cafe Shop at Hartamas',
        'group' => 'Design & Build',
        'title' => 'Cafe Shop at Hartamas',
        'category' => 'Café & Retail',
        'location' => 'Hartamas',
        'description' => 'A café environment designed around a welcoming storefront, a comfortable customer journey and a warm, cohesive interior experience.',
        'coverCandidates' => ['Storefront.png', 'Storefront.jpg', 'Storefront.webp', 'Cafe Shop at Hartamas.png', 'Café Interior.png']
    ],
    [
        'id' => 'concorde-shah-alam',
        'folder' => 'Concorde, Shah Alam',
        'group' => 'Design & Build',
        'title' => 'Concorde Hotel',
        'category' => 'Hospitality',
        'location' => 'Shah Alam',
        'description' => 'A hospitality project featuring guest-room, corridor and lounge spaces, brought together through a consistent material and lighting language.',
        'coverCandidates' => ['Front View.jpg', 'Front View.png', 'Concorde Hotel.png', 'Concorde, Shah Alam.png', 'Concorde Twin Room.png']
    ],
    [
        'id' => 'free-duty-shop-klia-2',
        'folder' => 'Free Duty Shop at KLIA 2',
        'group' => 'Design & Build',
        'title' => 'Free Duty Shop',
        'category' => 'Airport Retail',
        'location' => 'KLIA 2',
        'description' => 'An airport retail environment designed to make product displays clear, approachable and easy to navigate in a busy travel setting.',
        'coverCandidates' => ['Duty Free.png', 'Duty Free.jpg', 'Free Duty Shop at KLIA 2.png', 'Storefront.png', 'Showroom.png']
    ],
    [
        'id' => 'getthis-cyberjaya',
        'folder' => 'Getthis Cyberjaya',
        'group' => 'Design & Build',
        'title' => 'Getthis Cyberjaya',
        'category' => 'Commercial Interior',
        'location' => 'Cyberjaya',
        'description' => 'A commercial interior project focused on a clear customer experience, practical circulation and a cohesive visual identity throughout the space.',
        'coverCandidates' => ['Storefront.png', 'Front View.png', 'Getthis Cyberjaya.png', 'Retail Showroom.png']
    ],
    [
        'id' => 'hayyan-huda-cafe-centrio-s2',
        'folder' => 'Hayyan Huda Cafe, Centrio S2',
        'group' => 'Design & Build',
        'title' => 'Hayyan Huda Cafe',
        'category' => 'Café & Retail',
        'location' => 'Centrio S2',
        'description' => 'A café space featuring a bright contemporary interior and a distinctive storefront.',
        'coverCandidates' => ['Storefront.png', 'Interior.png']
    ],
    [
        'id' => 'kilang-yakult',
        'folder' => 'Kilang Yakult',
        'group' => 'Design & Build',
        'title' => 'Kilang Yakult',
        'category' => 'Industrial Facility',
        'location' => '',
        'description' => 'A facility project bringing together workplace, briefing and shared-use spaces in a coordinated environment.',
        'coverCandidates' => ['Kilang Yakult.png', 'Kilang Yakult.jpg', 'Front View.png']
    ],
    [
        'id' => 'klana-resort-seremban',
        'folder' => 'Klana Resort, Seremban',
        'group' => 'Design & Build',
        'title' => 'Klana Resort',
        'category' => 'Hospitality',
        'location' => 'Seremban',
        'description' => 'A resort project spanning public facilities and guest spaces, balancing a welcoming arrival with comfortable, considered interiors.',
        'coverCandidates' => ['Front View.png', 'Front View.jpg', 'Klana Resort.png', 'Klana Resort.jpg', 'Klana Resort, Seremban.png']
    ],
    [
        'id' => 'kooceng-cat-hotel-spa',
        'folder' => 'Kooceng Cat Hotel & Spa',
        'group' => 'Design & Build',
        'title' => 'Kooceng Cat Hotel & Spa',
        'category' => 'Retail & Hospitality',
        'location' => '',
        'description' => 'A specialist customer-facing environment shaped around practical display, welcoming service areas and carefully planned interior details.',
        'coverCandidates' => ['Reception.png', 'Storefront.png', 'Front View.png', 'Kooceng Cat Hotel & Spa.png', 'Kooceng.png']
    ],
    [
        'id' => 'masjid-dato-klana-petra-undang-luak-sungai-ujong',
        'folder' => "Masjid Dato' Klana Petra Undang Luak Sungai Ujong",
        'group' => 'Design & Build',
        'title' => "Masjid Dato' Klana Petra Undang Luak Sungai Ujong",
        'category' => 'Religious & Community',
        'location' => 'Seremban',
        'description' => 'A community and religious space highlighting the main hall, ablution facilities and architectural details that shape the visitor experience.',
        'coverCandidates' => ['Ornate Dome.png', 'Front View.png', "Masjid Dato' Klana Petra Undang Luak Sungai Ujong.png", 'Masjid Dato Klana.png', 'Masjid.png', 'Grand Hall.jpeg', 'Grand Hall.jpg']
    ],
    [
        'id' => 'naelofar-hijab',
        'folder' => 'Naelofar Hijab',
        'group' => 'Design & Build',
        'title' => 'Naelofar Hijab',
        'category' => 'Retail Boutique',
        'location' => '',
        'description' => 'A boutique retail interior with considered display zones, fitting areas and a storefront designed to make the brand immediately recognisable.',
        'coverCandidates' => ['Storefront.png', 'Storefront.jpg', 'Front View.png', 'Naelofar Hijab.png', 'Boutique Interior.png']
    ],
    [
        'id' => 'panggung-bangsawan-melaka',
        'folder' => 'Panggung Bangsawan Melaka',
        'group' => 'Design & Build',
        'title' => 'Panggung Bangsawan',
        'category' => 'Arts & Culture',
        'location' => 'Melaka',
        'description' => 'A performance and event venue featuring auditorium, ballroom and lobby spaces designed to create a strong arrival and audience experience.',
        'coverCandidates' => ['Panggung Bangsawan.png', 'Panggung Bangsawan.jpg', 'Front View.png', 'Lobby.png']
    ],
    [
        'id' => 'scrummy-restaurant-jalan-ipoh',
        'folder' => 'Scrummy Restaurant, Jalan Ipoh',
        'group' => 'Design & Build',
        'title' => 'Scrummy Restaurant',
        'category' => 'Food & Beverage',
        'location' => 'Jalan Ipoh',
        'description' => 'A restaurant with a welcoming storefront and a bright, comfortable dining environment.',
        'coverCandidates' => ['scrummy restaurant storefront.png', 'Interior.png']
    ],
    [
        'id' => 'subang-jaya-medical-centre',
        'folder' => 'Subang Jaya Medical Centre',
        'group' => 'Design & Build',
        'title' => 'Subang Jaya Medical Centre',
        'category' => 'Healthcare',
        'location' => 'Subang Jaya',
        'description' => 'A healthcare facility project focused on a clear exterior identity and a professional, approachable visitor experience.',
        'coverCandidates' => ['Subang Jaya Medical Centre.png', 'Subang Jaya Medical Centre.jpg', 'Front View.png']
    ],
    [
        'id' => 'bungalow-jalan-labu-planters-haven',
        'folder' => "Bungalow - Jalan Labu, Planters' Haven",
        'group' => 'Property',
        'title' => "Bungalow - Jalan Labu, Planters' Haven",
        'category' => 'Residential Property',
        'location' => 'Jalan Labu',
        'description' => 'A collection of contemporary, tropical and Tudor-inspired bungalow design concepts.',
        'coverCandidates' => ['Modern Contemporary House.png', 'Modern Tropical House.png', 'Modern Tudor House.png']
    ],
    [
        'id' => 'bungalow-ayer-keroh',
        'folder' => 'Bungalow, Ayer Keroh',
        'group' => 'Property',
        'title' => 'Bungalow, Ayer Keroh',
        'category' => 'Residential Property',
        'location' => 'Ayer Keroh',
        'description' => 'Residential bungalow concepts featuring modern corner and two-storey homes.',
        'coverCandidates' => ['Modern Corner House.png', 'Modern Two-Story Home.png']
    ],
    [
        'id' => 'bungalow-melaka',
        'folder' => 'Bungalow, Melaka',
        'group' => 'Property',
        'title' => 'Bungalow, Melaka',
        'category' => 'Residential Property',
        'location' => 'Melaka',
        'description' => 'Exterior views of a spacious two-storey residential bungalow.',
        'coverCandidates' => ['Front view.png', 'back view.png']
    ],
    [
        'id' => 'bungalow-nilai',
        'folder' => 'Bungalow, Nilai',
        'group' => 'Property',
        'title' => 'Bungalow, Nilai',
        'category' => 'Residential Property',
        'location' => 'Nilai',
        'description' => 'Modern two-storey bungalow design concepts with covered terraces and mixed-material façades.',
        'coverCandidates' => ['Modern Two-Story House with Covered Terrace.png', 'Modern White and Wood House.png', '3d.png']
    ],
    [
        'id' => 'bungalow-planters-haven',
        'folder' => "Bungalow, Planters' Haven",
        'group' => 'Property',
        'title' => "Bungalow, Planters' Haven",
        'category' => 'Residential Property',
        'location' => "Planters' Haven",
        'description' => 'Bungalow design studies in different exterior colours, layouts and roof configurations.',
        'coverCandidates' => ['Gray House.png', 'Beige Bungalow.png', 'Top View.png']
    ],
    [
        'id' => 'centralized-labour-quarters-pengerang-johor',
        'folder' => 'Centralized Labour Quarters, Pengerang Johor',
        'group' => 'Property',
        'title' => 'Centralized Labour Quarters, Pengerang Johor',
        'category' => 'Commercial Property',
        'location' => 'Pengerang, Johor',
        'description' => 'Site views of a centralised labour quarters property development.',
        'coverCandidates' => ['Site 1.png', 'Site 2.png', 'Site 3.png']
    ],
    [
        'id' => 'madrasah-al-aliyah-negeri-sembilan',
        'folder' => 'Madrasah Al-Aliyah, Negeri Sembilan',
        'group' => 'Property',
        'title' => 'Madrasah Al-Aliyah, Negeri Sembilan',
        'category' => 'Educational Property',
        'location' => 'Negeri Sembilan',
        'description' => 'Exterior architectural views of a madrasah facility.',
        'coverCandidates' => ['Exterior.png', 'Madrasah Exterior.png']
    ],
];

// Encode every path segment separately so spaces, apostrophes, ampersands and
// the accented "é" in Café Interior.png remain valid URL characters.
$makeUrl = static function (string $group, string $folder, string $filename): string {
    return 'assets/images/Portfolio/' . rawurlencode($group) . '/' . rawurlencode($folder) . '/' . rawurlencode($filename);
};

foreach ($projects as &$project) {
    $folderPath = $portfolioRoot . DIRECTORY_SEPARATOR . $project['group'] . DIRECTORY_SEPARATOR . $project['folder'];
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

    foreach ($files as $filename) {
        $baseName = pathinfo($filename, PATHINFO_FILENAME);
        if (preg_match('/^cover(?:[ _.-].*)?$/i', $baseName)) {
            $cover = $filename;
            break;
        }
    }

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
        'src' => $makeUrl($project['group'], $project['folder'], $cover),
        'name' => $cover
    ] : null;
    $project['images'] = array_map(static function (string $filename) use ($project, $makeUrl): array {
        return [
            'src' => $makeUrl($project['group'], $project['folder'], $filename),
            'name' => $filename
        ];
    }, $orderedImages);
    unset($project['folder'], $project['group'], $project['coverCandidates']);
}
unset($project);

echo json_encode(
    ['projects' => $projects],
    JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
);
