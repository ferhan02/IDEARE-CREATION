<?php
/** IDEARE portfolio feed: discover every project and supported photo recursively. */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');

// Preserve the editorial metadata and preferred covers of existing projects.
// New folders are automatically included without editing this list.
$catalogue = [
 ['Design & Build','Cafe Shop at Hartamas','cafe-shop-at-hartamas','Cafe Shop at Hartamas','Café & Retail','Hartamas','A café environment designed around a welcoming storefront, a comfortable customer journey and a warm, cohesive interior experience.',['Storefront.png','Storefront.jpg','Storefront.webp','Cafe Shop at Hartamas.png','Café Interior.png']],
 ['Design & Build','Concorde, Shah Alam','concorde-shah-alam','Concorde Hotel','Hospitality','Shah Alam','A hospitality project featuring guest-room, corridor and lounge spaces, brought together through a consistent material and lighting language.',['Front View.jpg','Front View.png','Concorde Hotel.png','Concorde, Shah Alam.png','Concorde Twin Room.png']],
 ['Design & Build','Free Duty Shop at KLIA 2','free-duty-shop-klia-2','Free Duty Shop','Airport Retail','KLIA 2','An airport retail environment designed to make product displays clear, approachable and easy to navigate in a busy travel setting.',['Duty Free.png','Duty Free.jpg','Free Duty Shop at KLIA 2.png','Storefront.png','Showroom.png']],
 ['Design & Build','Getthis Cyberjaya','getthis-cyberjaya','Getthis Cyberjaya','Commercial Interior','Cyberjaya','A commercial interior project focused on a clear customer experience, practical circulation and a cohesive visual identity throughout the space.',['Storefront.png','Front View.png','Getthis Cyberjaya.png','Retail Showroom.png']],
 ['Design & Build','Hayyan Huda Cafe, Centrio S2','hayyan-huda-cafe-centrio-s2','Hayyan Huda Cafe','Café & Retail','Centrio S2','A café space featuring a bright contemporary interior and a distinctive storefront.',['Storefront.png','Interior.png']],
 ['Design & Build','Kilang Yakult','kilang-yakult','Kilang Yakult','Industrial Facility','','A facility project bringing together workplace, briefing and shared-use spaces in a coordinated environment.',['Kilang Yakult.png','Kilang Yakult.jpg','Front View.png']],
 ['Design & Build','Klana Resort, Seremban','klana-resort-seremban','Klana Resort','Hospitality','Seremban','A resort project spanning public facilities and guest spaces, balancing a welcoming arrival with comfortable, considered interiors.',['Front View.png','Front View.jpg','Klana Resort.png','Klana Resort.jpg','Klana Resort, Seremban.png']],
 ['Design & Build','Kooceng Cat Hotel & Spa','kooceng-cat-hotel-spa','Kooceng Cat Hotel & Spa','Retail & Hospitality','','A specialist customer-facing environment shaped around practical display, welcoming service areas and carefully planned interior details.',['Reception.png','Storefront.png','Front View.png','Kooceng Cat Hotel & Spa.png','Kooceng.png']],
 ['Design & Build',"Masjid Dato' Klana Petra Undang Luak Sungai Ujong",'masjid-dato-klana-petra-undang-luak-sungai-ujong',"Masjid Dato' Klana Petra Undang Luak Sungai Ujong",'Religious & Community','Seremban','A community and religious space highlighting the main hall, ablution facilities and architectural details that shape the visitor experience.',['Ornate Dome.png','Front View.png',"Masjid Dato' Klana Petra Undang Luak Sungai Ujong.png",'Masjid Dato Klana.png','Masjid.png','Grand Hall.jpeg','Grand Hall.jpg']],
 ['Design & Build','Naelofar Hijab','naelofar-hijab','Naelofar Hijab','Retail Boutique','','A boutique retail interior with considered display zones, fitting areas and a storefront designed to make the brand immediately recognisable.',['Storefront.png','Storefront.jpg','Front View.png','Naelofar Hijab.png','Boutique Interior.png']],
 ['Design & Build','Panggung Bangsawan Melaka','panggung-bangsawan-melaka','Panggung Bangsawan','Arts & Culture','Melaka','A performance and event venue featuring auditorium, ballroom and lobby spaces designed to create a strong arrival and audience experience.',['Panggung Bangsawan.png','Panggung Bangsawan.jpg','Front View.png','Lobby.png']],
 ['Design & Build','Scrummy Restaurant, Jalan Ipoh','scrummy-restaurant-jalan-ipoh','Scrummy Restaurant','Food & Beverage','Jalan Ipoh','A restaurant with a welcoming storefront and a bright, comfortable dining environment.',['scrummy restaurant storefront.png','Interior.png']],
 ['Design & Build','Subang Jaya Medical Centre','subang-jaya-medical-centre','Subang Jaya Medical Centre','Healthcare','Subang Jaya','A healthcare facility project focused on a clear exterior identity and a professional, approachable visitor experience.',['Subang Jaya Medical Centre.png','Subang Jaya Medical Centre.jpg','Front View.png']],
 ['Property',"Bungalow - Jalan Labu, Planters' Haven",'bungalow-jalan-labu-planters-haven',"Bungalow - Jalan Labu, Planters' Haven",'Residential Property','Jalan Labu','A collection of contemporary, tropical and Tudor-inspired bungalow design concepts.',['Modern Contemporary House.png','Modern Tropical House.png','Modern Tudor House.png']],
 ['Property','Bungalow, Ayer Keroh','bungalow-ayer-keroh','Bungalow, Ayer Keroh','Residential Property','Ayer Keroh','Residential bungalow concepts featuring modern corner and two-storey homes.',['Modern Corner House.png','Modern Two-Story Home.png']],
 ['Property','Bungalow, Melaka','bungalow-melaka','Bungalow, Melaka','Residential Property','Melaka','Exterior views of a spacious two-storey residential bungalow.',['Front view.png','back view.png']],
 ['Property','Bungalow, Nilai','bungalow-nilai','Bungalow, Nilai','Residential Property','Nilai','Modern two-storey bungalow design concepts with covered terraces and mixed-material façades.',['Modern Two-Story House with Covered Terrace.png','Modern White and Wood House.png','3d.png']],
 ['Property',"Bungalow, Planters' Haven",'bungalow-planters-haven',"Bungalow, Planters' Haven",'Residential Property',"Planters' Haven",'Bungalow design studies in different exterior colours, layouts and roof configurations.',['Gray House.png','Beige Bungalow.png','Top View.png']],
 ['Property','Centralized Labour Quarters, Pengerang Johor','centralized-labour-quarters-pengerang-johor','Centralized Labour Quarters, Pengerang Johor','Commercial Property','Pengerang, Johor','Site views of a centralised labour quarters property development.',['Site 1.png','Site 2.png','Site 3.png']],
 ['Property','Madrasah Al-Aliyah, Negeri Sembilan','madrasah-al-aliyah-negeri-sembilan','Madrasah Al-Aliyah, Negeri Sembilan','Educational Property','Negeri Sembilan','Exterior architectural views of a madrasah facility.',['Exterior.png','Madrasah Exterior.png']],
];
$normalize = static function(string $name): string {
    return strtolower(preg_replace('/[\s\p{P}]+/u', '', trim($name)) ?? $name);
};
$key = static fn(string $group, string $folder): string => $normalize($group).'|'.$normalize($folder);
$metadata = [];
foreach ($catalogue as $row) { $metadata[$key($row[0],$row[1])] = $row; }
$extensions = ['jpg','jpeg','jpe','jfif','png','webp','avif','gif','bmp','ico','svg'];
// Use the actual on-disk spelling, including on case-sensitive Linux hosts.
$entries = static function(string $dir): array {
    if (!is_dir($dir) || !is_readable($dir)) return [];
    $items = array_values(array_filter(@scandir($dir) ?: [], static fn($n) => $n !== '' && $n[0] !== '.'));
    usort($items, 'strnatcasecmp');
    return $items;
};
$imagesRoot = dirname(__DIR__).'/assets/images';
$roots = [];
foreach ($entries($imagesRoot) as $name) {
    if (strcasecmp($name,'Portfolio')===0 && is_dir($imagesRoot.'/'.$name) && !is_link($imagesRoot.'/'.$name)) $roots[]=$name;
}
$scan = static function(string $directory, string $prefix = '') use (&$scan,$entries,$extensions): array {
    $files=[];
    foreach ($entries($directory) as $name) {
        $full=$directory.'/'.$name;
        if (is_link($full)) continue; // Do not follow links outside the portfolio or create recursion loops.
        $relative=$prefix.$name;
        if (is_dir($full)) { foreach ($scan($full,$relative.'/') as $file) $files[]=$file; }
        elseif (is_file($full) && is_readable($full) && in_array(strtolower(pathinfo($name,PATHINFO_EXTENSION)),$extensions,true)) $files[]=$relative;
    }
    usort($files,'strnatcasecmp');
    return $files;
};
$projects=[];
foreach ($roots as $rootName) {
    $root=$imagesRoot.'/'.$rootName;
    foreach ($entries($root) as $group) {
        $groupKey=$normalize($group);
        if (!in_array($groupKey,[$normalize('Design & Build'),$normalize('Property')],true)) continue;
        $groupPath=$root.'/'.$group;
        if (!is_dir($groupPath) || is_link($groupPath)) continue;
        foreach ($entries($groupPath) as $folder) {
            $folderPath=$groupPath.'/'.$folder;
            if (!is_dir($folderPath) || is_link($folderPath)) continue;
            $files=$scan($folderPath);
            $row=$metadata[$key($group,$folder)] ?? null;
            $id=$row[2] ?? ('project-'.substr(hash('sha256',$group.'/'.$folder),0,16));
            $cover=null;
            foreach ($files as $file) {
                if (preg_match('/^cover(?:[ _.-].*)?$/i',pathinfo($file,PATHINFO_FILENAME))) { $cover=$file; break; }
            }
            if ($cover===null) foreach (($row[7] ?? []) as $candidate) {
                foreach ($files as $file) if (strcasecmp(basename($file),$candidate)===0) { $cover=$file; break 2; }
            }
            if ($cover===null) foreach ($files as $file) {
                if (preg_match('/storefront|front[ _-]*view|exterior|facade|building|main[ _-]*entrance/i',basename($file))) { $cover=$file; break; }
            }
            $cover=$cover ?? ($files[0] ?? null);
            $ordered=$files;
            if ($cover!==null) $ordered=array_merge([$cover],array_values(array_filter($files,static fn($f)=>$f!==$cover)));
            $image=static function(string $file) use ($rootName,$group,$folder): array {
                $segments=array_merge([$rootName,$group,$folder],explode('/',$file));
                return ['src'=>'assets/images/'.implode('/',array_map('rawurlencode',$segments)), 'name'=>basename($file)];
            };
            $projects[]=['id'=>$id,'title'=>$row[3] ?? $folder,'category'=>$row[4] ?? $group,'location'=>$row[5] ?? '', 'description'=>$row[6] ?? '', 'cover'=>$cover!==null?$image($cover):null, 'images'=>array_map($image,$ordered)];
        }
    }
}
echo json_encode(['projects'=>$projects],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
