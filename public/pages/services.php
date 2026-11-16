<?php
/**
 * IDEARE Services. Four service disciplines and a compact, accessible process explorer.
 * All process photography is optional and automatically detected from the manifest paths.
 * The site's existing customer header, footer, booking and theme implementations remain in use.
 */
$pageTitle = 'Our Services | IDEARE Creation';
$pageStyles = ['assets/css/services.css'];
$pageScripts = ['assets/js/services.js'];
require __DIR__ . '/../../includes/customer/header.php';

$siteRoot = dirname(__DIR__, 2);
$asset = static function (string $path) use ($siteRoot, $customerRoot): ?string {
    if (!is_file($siteRoot . '/' . $path)) return null;
    return $customerRoot . $path;
};

$services = [
    'consulting' => [
        'name' => 'Consulting', 'ordinal' => '01', 'tagline' => 'Find the right direction.',
        'description' => 'We begin by understanding your space, lifestyle, preferences and budget. Our team helps you explore possibilities and determine the right direction for your project.',
        'coverFile' => 'assets/images/Services/Consultation.png',
        'folder' => 'Consulting',
        'steps' => [
            ['title' => 'Initial Enquiry', 'file' => '01-initial-enquiry.webp',
                'doing' => 'We listen to your ideas and gather the first details about your space, goals and requirements.',
                'expect' => 'A clearer starting brief and guidance on the information or photographs that would help us proceed.'],
            ['title' => 'Consultation', 'file' => '02-consultation.webp',
                'doing' => 'We discuss how you use the space, your visual preferences, practical priorities and intended budget.',
                'expect' => 'A shared understanding of your priorities and the questions that need to be resolved.'],
            ['title' => 'Site Assessment', 'file' => '03-site-assessment.webp',
                'doing' => 'When needed, we review the existing space, relevant measurements, site conditions and possible constraints.',
                'expect' => 'An initial understanding of site conditions and any further measurements or checks required.'],
            ['title' => 'Recommendations', 'file' => '04-recommendations.webp',
                'doing' => 'We consider suitable solutions and explain the practical options available for your project.',
                'expect' => 'Recommendations that connect your requirements with realistic design or project possibilities.'],
            ['title' => 'Proposal', 'file' => '05-proposal.webp',
                'doing' => 'We discuss a proposed direction, the potential scope and the next decisions needed to move forward.',
                'expect' => 'An outline of the suggested next steps. Formal fees and deliverables are confirmed separately.'],
        ],
    ],
    'architecture' => [
        'name' => 'Architecture', 'ordinal' => '02', 'tagline' => 'Plan with purpose.',
        'description' => 'We develop spatial layouts, technical plans and architectural solutions that balance functionality, structural requirements and visual harmony.',
        'coverFile' => 'assets/images/Services/Architecture.png',
        'folder' => 'Architecture',
        'steps' => [
            ['title' => 'Discovery', 'file' => '01-discovery.webp',
                'doing' => 'We review the site, the project objectives and the information available about existing conditions.',
                'expect' => 'A defined brief and an understanding of where specialist input may be needed.'],
            ['title' => 'Space Planning', 'file' => '02-space-planning.webp',
                'doing' => 'We explore room relationships, movement between spaces and arrangements that support daily use.',
                'expect' => 'Possible layout directions for discussion and refinement.'],
            ['title' => 'Concept Design', 'file' => '03-concept-design.webp',
                'doing' => 'We develop the overall design direction with attention to proportions, atmosphere and practicality.',
                'expect' => 'Concept ideas and visual references appropriate to the agreed scope.'],
            ['title' => 'Technical Development', 'file' => '04-technical-development.webp',
                'doing' => 'We refine dimensions, material considerations and relevant technical information with the project team.',
                'expect' => 'More detailed planning information where included in the agreed services.'],
            ['title' => 'Coordination', 'file' => '05-coordination.webp',
                'doing' => 'We coordinate design information with the relevant parties and identify requirements for qualified consultants.',
                'expect' => 'Clearer responsibilities and next steps for any applicable technical reviews or statutory submissions.'],
        ],
        'note' => 'Regulated architectural work and statutory submissions, if required, depend on the agreed scope and appropriately qualified professionals.',
    ],
    'interior-design' => [
        'name' => 'Interior Design', 'ordinal' => '03', 'tagline' => 'Shape the feeling of a space.',
        'description' => 'We shape the atmosphere of your interior through thoughtful space planning, cabinetry, materials, finishes, lighting and carefully considered details.',
        'coverFile' => 'assets/images/Services/Interior.png',
        'folder' => 'Interior-Design',
        'steps' => [
            ['title' => 'Style Discovery', 'file' => '01-style-discovery.webp',
                'doing' => 'We learn about your taste, routines, favourite references and the practical needs of the space.',
                'expect' => 'A shared direction for the look, feel and function of the interior.'],
            ['title' => 'Concept Development', 'file' => '02-concept-development.webp',
                'doing' => 'We explore design themes, moodboards, material directions and visual references.',
                'expect' => 'An initial concept that helps you picture the atmosphere and character of the space.'],
            ['title' => 'Layout and Visualization', 'file' => '03-layout-and-visualization.webp',
                'doing' => 'We develop suitable room layouts, storage arrangements and visual presentations for review.',
                'expect' => 'A clearer view of how your interior and custom cabinetry could work together.'],
            ['title' => 'Material Selection', 'file' => '04-material-selection.webp',
                'doing' => 'We explore surfaces, finishes, colours, lighting and hardware that suit the design and its intended use.',
                'expect' => 'A coordinated material direction with choices ready for further review.'],
            ['title' => 'Design Finalization', 'file' => '05-design-finalization.webp',
                'doing' => 'We refine the chosen direction and resolve applicable design details for the next stage.',
                'expect' => 'A confirmed design direction and the relevant next steps, based on the agreed scope.'],
        ],
    ],
    'construction' => [
        'name' => 'Construction', 'ordinal' => '04', 'tagline' => 'Make the plan tangible.',
        'description' => 'We turn approved designs into physical spaces through coordinated site preparation, construction, cabinetry fabrication, installation and final quality checks.',
        'coverFile' => 'assets/images/Services/Construction.png',
        'folder' => 'Construction',
        'steps' => [
            ['title' => 'Site Preparation', 'file' => '01-site-preparation.webp',
                'doing' => 'We review the agreed scope, confirm site conditions and coordinate practical access for the planned works.',
                'expect' => 'A shared understanding of site readiness and how the work will be organized.'],
            ['title' => 'Construction Works', 'file' => '02-construction-works.webp',
                'doing' => 'Our team coordinates the renovation or construction activities included in the agreed project scope.',
                'expect' => 'Visible progress on the site, with requirements and changes addressed through project coordination.'],
            ['title' => 'Cabinet Fabrication', 'file' => '03-cabinet-fabrication.webp',
                'doing' => 'Custom cabinetry is manufactured to approved measurements, materials and fabrication specifications.',
                'expect' => 'Cabinet components prepared for the planned installation and finishing work.'],
            ['title' => 'Installation', 'file' => '04-installation.webp',
                'doing' => 'We install cabinetry, fittings and the other elements included in the confirmed scope.',
                'expect' => 'The intended design taking shape on site, with details checked as installation progresses.'],
            ['title' => 'Inspection and Handover', 'file' => '05-inspection-and-handover.webp',
                'doing' => 'We review completed work, identify outstanding items and coordinate the final checks before handover.',
                'expect' => 'A project review and handover process appropriate to the work undertaken.'],
        ],
        'note' => 'Construction and renovation work are provided according to the agreed project scope, site conditions and applicable specialist requirements.',
    ],
];

foreach ($services as $key => &$service) {
    $service['cover'] = $asset($service['coverFile']);
    foreach ($service['steps'] as &$step) {
        $step['imageFile'] = 'assets/images/Services/Process/' . $service['folder'] . '/' . $step['file'];
        $step['image'] = $asset($step['imageFile']);
        unset($step['file']);
    }
    unset($step);
    unset($service['folder']);
}
unset($service);

$serviceKey = $_GET['service'] ?? 'consulting';
if (!is_string($serviceKey) || !isset($services[$serviceKey])) $serviceKey = 'consulting';
$stepNumber = filter_input(INPUT_GET, 'step', FILTER_VALIDATE_INT);
$stepIndex = $stepNumber && $stepNumber >= 1 && $stepNumber <= 5 ? $stepNumber - 1 : 0;
$currentService = $services[$serviceKey];
$currentStep = $currentService['steps'][$stepIndex];
$bookUrl = htmlspecialchars($customerRoot . 'pages/book-appointment.php', ENT_QUOTES, 'UTF-8');
$designerUrl = htmlspecialchars($customerRoot . 'designer/index.php', ENT_QUOTES, 'UTF-8');
$heroSource = $asset('assets/images/Services/Service-Hero.webp') ?: $asset('assets/images/Services/Interior.png');
$h = static fn($value) => htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
?>
<main class="sx-page" id="services-top" data-sx-current="<?= $h($serviceKey) ?>">
    <section class="sx-hero sx-screen" id="services-introduction" aria-labelledby="sx-hero-title">
        <div class="sx-hero-grid-art" aria-hidden="true"></div>
        <div class="site-wrap sx-container sx-hero-inner">
            <div class="sx-hero-copy sx-reveal">
                <p class="sx-eyebrow"><span class="sx-line"></span> IDEARE / OUR SERVICES</p>
                <h1 id="sx-hero-title">FROM VISION <em>TO REALITY.</em></h1>
                <p class="sx-hero-lead">Every space begins with an idea. Discover how IDEARE transforms your vision into carefully designed and crafted environments.</p>
                <div class="sx-hero-actions">
                    <a class="sx-button sx-button-primary" href="#services-overview">Explore our services <span aria-hidden="true">↗</span></a>
                    <a class="sx-text-link" href="<?= $bookUrl ?>">Discuss your project <span aria-hidden="true">↗</span></a>
                </div>
                <div class="sx-hero-foot"><span>DESIGN <b>·</b> PLAN <b>·</b> CRAFT</span><span>SCROLL TO DISCOVER <span aria-hidden="true">↓</span></span></div>
            </div>
            <figure class="sx-hero-photo sx-reveal" aria-label="Illustrative interior design scene">
                <?php if ($heroSource): ?><img src="<?= $h($heroSource) ?>" alt="Contemporary interior with custom cabinetry, shown as an illustrative design reference" fetchpriority="high" decoding="async" /><?php endif; ?>
                <span class="sx-hero-photo-shade" aria-hidden="true"></span>
                <figcaption><span>IDEARE / DESIGN STUDIES</span><span>01 <span aria-hidden="true">/</span> 04</span></figcaption>
            </figure>
        </div>
        <div class="sx-hero-index" aria-hidden="true">01 / INTRODUCTION</div>
    </section>

    <section class="sx-overview sx-screen" id="services-overview" aria-labelledby="sx-overview-heading">
        <div class="site-wrap sx-container">
            <header class="sx-section-head sx-reveal">
                <div><p class="sx-eyebrow"><span class="sx-line"></span> EXPLORE OUR DISCIPLINES</p><h2 id="sx-overview-heading">Different disciplines. <em>One clear direction.</em></h2></div>
                <p>Explore the services that fit your project. Each one can be discussed on its own or alongside other agreed work.</p>
            </header>
            <div class="sx-panels" aria-label="Choose a service to explore">
                <?php foreach ($services as $key => $service): ?>
                <a class="sx-panel <?= $key === $serviceKey ? 'is-active' : '' ?>" href="?service=<?= $h($key) ?>#services-process" data-sx-service="<?= $h($key) ?>" aria-label="Explore <?= $h($service['name']) ?> process">
                    <?php if ($service['cover']): ?>
                        <img src="<?= $h($service['cover']) ?>" alt="" loading="lazy" decoding="async" />
                    <?php else: ?>
                        <span class="sx-panel-fallback" aria-hidden="true"><span class="sx-drawing-shape"></span><span>ARCHITECTURAL VISUAL</span></span>
                    <?php endif; ?>
                    <span class="sx-panel-wash" aria-hidden="true"></span>
                    <span class="sx-panel-top"><small>DISCIPLINE</small><span><?= $h($service['ordinal']) ?></span></span>
                    <span class="sx-panel-copy"><strong><?= $h($service['name']) ?></strong><span class="sx-panel-description"><?= $h($service['description']) ?></span><small>Explore process <span aria-hidden="true">↗</span></small></span>
                </a>
                <?php endforeach; ?>
            </div>
            <div class="sx-overview-bottom"><span>SELECT A SERVICE TO REVEAL THE PROCESS</span><a href="#services-process">VIEW THE PROCESS <span aria-hidden="true">↓</span></a></div>
        </div>
    </section>

    <section class="sx-process sx-screen" id="services-process" aria-labelledby="sx-process-heading">
        <div class="site-wrap sx-container">
            <header class="sx-process-header sx-reveal">
                <div class="sx-process-title"><p class="sx-eyebrow"><span class="sx-line"></span> HOW WE WORK</p><h2 id="sx-process-heading">The process, <em>made clear.</em></h2></div>
                <div class="sx-service-switcher" aria-label="Select a process to explore">
                    <?php foreach ($services as $key => $service): ?>
                    <a href="?service=<?= $h($key) ?>#services-process" data-sx-switch="<?= $h($key) ?>" aria-current="<?= $key === $serviceKey ? 'true' : 'false' ?>" class="sx-service-chip <?= $key === $serviceKey ? 'is-active' : '' ?>"><?= $h($service['name']) ?></a>
                    <?php endforeach; ?>
                </div>
            </header>
            <div class="sx-step-bar" role="group" aria-label="Process steps">
                <?php foreach ($currentService['steps'] as $index => $step): ?>
                <a class="sx-step-dot <?= $index === $stepIndex ? 'is-active' : '' ?>" href="?service=<?= $h($serviceKey) ?>&amp;step=<?= $index + 1 ?>#services-process" data-sx-step="<?= $index ?>" <?= $index === $stepIndex ? 'aria-current="step"' : '' ?> aria-label="Step <?= $index + 1 ?>: <?= $h($step['title']) ?>"><span><?= str_pad((string)($index + 1), 2, '0', STR_PAD_LEFT) ?></span><small><?= $h($step['title']) ?></small></a>
                <?php endforeach; ?>
            </div>
            <div class="sx-explorer" id="sx-explorer">
                <figure class="sx-process-visual" aria-label="Process step imagery">
                    <img class="sx-process-image" src="<?= $h($currentStep['image'] ?: '') ?>" alt="<?= $h($currentStep['image'] ? $currentStep['title'] . ' process illustration' : '') ?>" decoding="async" <?= $currentStep['image'] ? '' : 'hidden' ?> />
                    <span class="sx-visual-placeholder" <?= $currentStep['image'] ? 'hidden' : '' ?> aria-hidden="true">
                        <span class="sx-visual-blueprint"><i></i><i></i><i></i></span>
                        <span class="sx-visual-placeholder-text"><span>PROCESS / <?= $h($currentService['ordinal']) ?></span><strong>Photography coming soon.</strong><small data-sx-image-path><?= $h(substr($currentStep['imageFile'], strlen('assets/images/Services/'))) ?></small></span>
                    </span>
                    <figcaption><span class="sx-visual-label">IDEARE / <?= $h(strtoupper($currentService['name'])) ?></span><span class="sx-visual-count" data-sx-visual-count><?= str_pad((string)($stepIndex + 1), 2, '0', STR_PAD_LEFT) ?> / 05</span></figcaption>
                </figure>
                <div class="sx-process-detail">
                    <div class="sx-detail-top"><span class="sx-detail-kicker">CURRENT PROCESS</span><span class="sx-detail-counter" data-sx-counter><?= str_pad((string)($stepIndex + 1), 2, '0', STR_PAD_LEFT) ?> <span>/</span> 05</span></div>
                    <div class="sx-process-copy" data-sx-animated-copy>
                        <p class="sx-step-service" data-sx-service-name><?= $h($currentService['name']) ?></p>
                        <h3 data-sx-step-title><?= $h($currentStep['title']) ?></h3>
                        <div class="sx-detail-grid">
                            <div><p class="sx-detail-label">WHAT IDEARE DOES</p><p data-sx-doing><?= $h($currentStep['doing']) ?></p></div>
                            <div><p class="sx-detail-label">WHAT TO EXPECT</p><p data-sx-expect><?= $h($currentStep['expect']) ?></p></div>
                        </div>
                        <p class="sx-service-note" data-sx-note <?= empty($currentService['note']) ? 'hidden' : '' ?>><?= $h($currentService['note'] ?? '') ?></p>
                    </div>
                    <div class="sx-detail-bottom"><div class="sx-progress-indicator" role="progressbar" aria-label="Process progress" aria-valuemin="1" aria-valuemax="5" aria-valuenow="<?= $stepIndex + 1 ?>"><span class="sx-progress-fill" style="width:<?= (($stepIndex + 1) / 5) * 100 ?>%"></span></div>
                        <div class="sx-step-navigation"><button class="sx-arrow" type="button" data-sx-previous aria-label="Previous process step" <?= $stepIndex === 0 ? 'disabled' : '' ?>>←</button><button class="sx-arrow sx-arrow-next" type="button" data-sx-next aria-label="Next process step" <?= $stepIndex === 4 ? 'disabled' : '' ?>>→</button></div>
                    </div>
                </div>
            </div>
            <div class="sx-process-bottom"><p>Explore the steps at your own pace. Exact services and deliverables are confirmed for each project.</p><a class="sx-inline-link" href="<?= $designerUrl ?>">Explore the Cabinet Designer <span aria-hidden="true">↗</span></a></div>
            <p class="sx-sr-only" role="status" aria-live="polite" aria-atomic="true" data-sx-announcement></p>
        </div>
    </section>

    <section class="sx-journey sx-screen" id="services-journey" aria-labelledby="sx-journey-heading">
        <div class="site-wrap sx-container">
            <header class="sx-section-head sx-journey-header sx-reveal"><div><p class="sx-eyebrow"><span class="sx-line"></span> LET US GUIDE YOU</p><h2 id="sx-journey-heading">WHAT ARE <em>YOU PLANNING?</em></h2></div><p>Tell us what you have in mind. We will suggest a useful place to begin.</p></header>
            <div class="sx-journey-layout">
                <div class="sx-choice-list" role="group" aria-label="Choose what you are planning">
                    <button class="sx-choice is-selected" type="button" data-sx-choice="cabinetry" aria-pressed="true"><span class="sx-choice-number">01</span><span><strong>Custom Cabinetry</strong><small>I want custom kitchen cabinets, wardrobes or storage.</small></span><span class="sx-choice-arrow" aria-hidden="true">↗</span></button>
                    <button class="sx-choice" type="button" data-sx-choice="interior" aria-pressed="false"><span class="sx-choice-number">02</span><span><strong>Interior Design</strong><small>I want to redesign the interior of my space.</small></span><span class="sx-choice-arrow" aria-hidden="true">↗</span></button>
                    <button class="sx-choice" type="button" data-sx-choice="renovation" aria-pressed="false"><span class="sx-choice-number">03</span><span><strong>Renovation and Construction</strong><small>I want to renovate or construct a space.</small></span><span class="sx-choice-arrow" aria-hidden="true">↗</span></button>
                    <button class="sx-choice" type="button" data-sx-choice="unsure" aria-pressed="false"><span class="sx-choice-number">04</span><span><strong>Not Sure Yet</strong><small>I have an idea but I am not sure where to start.</small></span><span class="sx-choice-arrow" aria-hidden="true">↗</span></button>
                </div>
                <aside class="sx-recommendation" aria-live="polite" aria-atomic="true">
                    <p class="sx-recommendation-label">YOUR RECOMMENDED STARTING POINT</p>
                    <span class="sx-recommendation-mark" aria-hidden="true">↗</span>
                    <h3 data-sx-recommend-title>Start with your cabinetry layout.</h3>
                    <p data-sx-recommend-text>Use the 3D Cabinet Designer to explore custom measurements, storage arrangements and an initial layout. Our team can help refine it during consultation.</p>
                    <div class="sx-recommendation-actions"><a class="sx-button sx-button-light" data-sx-primary href="<?= $designerUrl ?>">Open Cabinet Designer <span aria-hidden="true">↗</span></a><a class="sx-recommendation-secondary" data-sx-secondary href="<?= $bookUrl ?>">Book a consultation <span aria-hidden="true">↗</span></a></div>
                    <p class="sx-recommendation-foot">Every project is different. You can begin with the service that best matches your needs.</p>
                </aside>
            </div>
        </div>
    </section>
</main>
<script type="application/json" id="sx-services-data"><?= json_encode(['services' => $services, 'initialService' => $serviceKey, 'initialStep' => $stepIndex, 'bookingUrl' => $customerRoot . 'pages/book-appointment.php', 'designerUrl' => $customerRoot . 'designer/index.php'], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE) ?></script>
<?php require __DIR__ . '/../../includes/customer/footer.php'; ?>
