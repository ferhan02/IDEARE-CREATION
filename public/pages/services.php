<?php
/** IDEARE | Services. Three process stages per service, with optional local photography. */
$pageTitle = 'Services | IDEARE Creation';
$pageStyles = ['assets/css/services.css'];
$pageScripts = ['assets/js/services.js'];
require __DIR__ . '/../../includes/customer/header.php';

$siteRoot = dirname(__DIR__, 2);
$siteAsset = static function (string $path) use ($siteRoot, $customerRoot): ?string {
    return is_file($siteRoot . '/' . $path) ? $customerRoot . $path : null;
};
$processDir = 'assets/images/Services/Process/';
$services = [
    'consulting' => [
        'name' => 'Consulting', 'number' => '01', 'eyebrow' => 'Discover the possibilities',
        'description' => 'We listen to your ideas, understand your requirements and help you determine the most suitable direction for your project.',
        'coverPath' => 'assets/images/Services/Consultation.png',
        'steps' => [
            ['title' => 'Brief', 'file' => 'Consulting/01-brief.webp', 'subject' => 'Client consultation or project discussion',
             'doing' => 'We discuss your goals, preferences, requirements and budget.', 'expect' => 'A clear starting brief and shared priorities.'],
            ['title' => 'Analysis', 'file' => 'Consulting/02-analysis.webp', 'subject' => 'Site inspection, measurements or project evaluation',
             'doing' => 'We assess the project site, practical needs and available possibilities.', 'expect' => 'An understanding of the opportunities and any constraints.'],
            ['title' => 'Plan', 'file' => 'Consulting/03-plan.webp', 'subject' => 'Proposed layouts, project planning or design documentation',
             'doing' => 'We recommend an appropriate direction and outline the next steps.', 'expect' => 'A practical path forward for your project.'],
        ],
    ],
    'architecture' => [
        'name' => 'Architecture', 'number' => '02', 'eyebrow' => 'Planning with purpose',
        'description' => 'We develop thoughtful architectural solutions that combine spatial functionality, technical planning and design.',
        'coverPath' => 'assets/images/Services/Process/Architecture/00-overview.webp',
        'steps' => [
            ['title' => 'Research', 'file' => 'Architecture/01-research.webp', 'subject' => 'Architectural site study or preliminary drawings',
             'doing' => 'We study the site, building requirements and overall project objectives.', 'expect' => 'A clear design brief and understanding of site considerations.'],
            ['title' => 'Design', 'file' => 'Architecture/02-design.webp', 'subject' => 'Architectural concepts, floor plans or design models',
             'doing' => 'We develop concepts, spatial layouts and drawings within the agreed scope.', 'expect' => 'Design options that explain how the space could work.'],
            ['title' => 'Development', 'file' => 'Architecture/03-development.webp', 'subject' => 'Technical drawings or architectural coordination',
             'doing' => 'We refine technical details and coordinate the relevant next stages.', 'expect' => 'A coordinated design direction and next steps.'],
        ],
        'note' => 'Regulated architectural services and statutory submissions require appropriately qualified professionals and a separately agreed scope.',
    ],
    'interior-design' => [
        'name' => 'Interior Design', 'number' => '03', 'eyebrow' => 'Spaces shaped for living',
        'description' => 'We create functional and beautiful interiors through thoughtful space planning, carefully selected materials, refined finishes and custom cabinetry.',
        'coverPath' => 'assets/images/Services/Interior.png',
        'steps' => [
            ['title' => 'Conceptualization', 'file' => 'Interior-Design/01-conceptualization.webp', 'subject' => 'Interior inspiration, moodboards and design concepts',
             'doing' => 'We explore interior styles, layouts, your preferences and design possibilities.', 'expect' => 'A shared creative direction for your space.'],
            ['title' => 'Ideation', 'file' => 'Interior-Design/02-ideation.webp', 'subject' => '3D visuals, material samples and custom cabinetry design',
             'doing' => 'We develop design concepts, 3D visualizations, material choices and custom cabinetry designs.', 'expect' => 'A clearer view of the interior and the details to refine.'],
            ['title' => 'Transformation', 'file' => 'Interior-Design/03-transformation.webp', 'subject' => 'Finished interior featuring refined finishes and custom cabinetry',
             'doing' => 'We finalize the interior direction and coordinate its realization, including cabinetry fabrication and installation where included.',
             'expect' => 'An agreed design and a coordinated route to its completion.'],
        ],
        'note' => 'Cabinet design, manufacturing and installation are part of our Interior Design offering where included in the agreed project scope.',
    ],
    'construction' => [
        'name' => 'Construction', 'number' => '04', 'eyebrow' => 'Built with care',
        'description' => 'We undertake building construction and renovation works, transforming approved plans into completed spaces through careful coordination, skilled workmanship and quality execution.',
        'coverPath' => 'assets/images/Services/Construction.png',
        'steps' => [
            ['title' => 'Preparation', 'file' => 'Construction/01-preparation.webp', 'subject' => 'Construction site assessment and preparation',
             'doing' => 'We assess site conditions, confirm construction requirements, establish the agreed scope and plan the work.',
             'expect' => 'A clear construction plan and coordinated site preparations.'],
            ['title' => 'Construction', 'file' => 'Construction/02-construction.webp', 'subject' => 'Actual building construction, structural work or renovation in progress',
             'doing' => 'We carry out the building, renovation and associated construction works within the agreed scope.',
             'expect' => 'A project taking shape through coordinated site work.'],
            ['title' => 'Completion', 'file' => 'Construction/03-completion.webp', 'subject' => 'Completed building or renovated space ready for handover',
             'doing' => 'We inspect the completed work, address outstanding items and prepare the project for handover.',
             'expect' => 'A final review and a coordinated handover.'],
        ],
        'note' => 'The precise construction works and any specialist services depend on the agreed scope and applicable project requirements.',
    ],
];
foreach ($services as &$service) {
    $service['cover'] = $siteAsset($service['coverPath']);
    foreach ($service['steps'] as &$step) {
        $step['imagePath'] = $processDir . $step['file'];
        $step['image'] = $siteAsset($step['imagePath']);
    }
    unset($step);
}
unset($service);
$choice = $_GET['service'] ?? 'consulting';
$activeKey = is_string($choice) && isset($services[$choice]) ? $choice : 'consulting';
$activeService = $services[$activeKey];
$stepQuery = filter_input(INPUT_GET, 'step', FILTER_VALIDATE_INT);
$activeStep = max(0, min(2, ($stepQuery ?: 1) - 1));
$h = static fn ($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
$bookUrl = $customerRoot . 'pages/book-appointment.php';
$designerUrl = $customerRoot . 'designer/index.php';
?>
<main class="sx-page" id="main-content">
  <section class="sx-hero" aria-labelledby="sx-title">
    <div class="sx-hero-inner site-wrap">
      <div class="sx-hero-copy">
        <p class="sx-overline"><span class="sx-overline-rule"></span> IDEARE / OUR SERVICES</p>
        <h1 id="sx-title">FROM VISION<br><em>TO REALITY.</em></h1>
        <p class="sx-hero-lead">Every space begins with an idea. Discover how IDEARE brings planning, design and construction together to create carefully considered spaces.</p>
        <div class="sx-hero-actions"><a class="sx-btn sx-btn-primary" href="#services-presentation">Explore our services <span aria-hidden="true">↘</span></a><a class="sx-btn sx-btn-quiet" href="<?= $h($bookUrl) ?>">Book a consultation <span aria-hidden="true">↗</span></a></div>
        <div class="sx-hero-signature"><span>CONSULTING</span><i></i><span>ARCHITECTURE</span><i></i><span>INTERIOR DESIGN</span><i></i><span>CONSTRUCTION</span></div>
      </div>
      <div class="sx-hero-visual" aria-label="Illustrative visual of building and interior work">
        <?php if ($siteAsset('assets/images/Services/Construction.png')): ?>
        <img class="sx-hero-image" src="<?= $h($siteAsset('assets/images/Services/Construction.png')) ?>" alt="Illustrative construction site visual" fetchpriority="high" decoding="async" width="870" height="1060">
        <?php endif; ?>
        <span class="sx-hero-visual-wash" aria-hidden="true"></span>
        <div class="sx-hero-vertical" aria-hidden="true">DESIGN · BUILD · CREATE</div>
        <div class="sx-hero-visual-label"><small>01 / 04</small><span>FROM THE IDEA<br>TO THE BUILT SPACE</span></div>
      </div>
    </div>
    <div class="sx-hero-bottom site-wrap"><span>FOUR CONNECTED DISCIPLINES</span><span>DISCOVER THE PROCESS <span aria-hidden="true">↓</span></span></div>
  </section>

  <section class="sx-showcase" id="services-presentation" aria-labelledby="sx-showcase-heading">
    <div class="site-wrap sx-showcase-inner">
      <header class="sx-showcase-heading">
        <div class="sx-showcase-heading-main"><p class="sx-overline"><span class="sx-overline-rule"></span> WHAT WE DO</p>
          <h2 id="sx-showcase-heading">The work behind <em>every space.</em></h2></div>
        <p>Select a discipline to explore the three steps that shape its process. Each service can stand on its own or work alongside other agreed services.</p>
      </header>
      <nav class="sx-service-nav" aria-label="Choose a service" data-sx-services>
        <?php foreach ($services as $key => $service): ?>
        <a href="?service=<?= $h($key) ?>#services-presentation" data-sx-service="<?= $h($key) ?>" class="sx-service-tab<?= $key === $activeKey ? ' is-active' : '' ?>" <?= $key === $activeKey ? 'aria-current="true"' : '' ?>><span><?= $h($service['number']) ?></span><?= $h($service['name']) ?></a>
        <?php endforeach; ?>
      </nav>
      <div class="sx-service-stage" data-sx-stage>
        <aside class="sx-service-aside" aria-live="polite" aria-atomic="true">
          <span class="sx-service-index" data-sx-number><?= $h($activeService['number']) ?> <span>/ 04</span></span>
          <p class="sx-mini-label" data-sx-eyebrow><?= $h($activeService['eyebrow']) ?></p>
          <h3 data-sx-name><?= $h($activeService['name']) ?></h3>
          <p class="sx-service-description" data-sx-description><?= $h($activeService['description']) ?></p>
          <p class="sx-service-note" data-sx-note <?= empty($activeService['note']) ? 'hidden' : '' ?>><?= $h($activeService['note'] ?? '') ?></p>
          <div class="sx-service-aside-footer"><div class="sx-aside-track"><span data-sx-aside-fill style="width:<?= round(($activeStep + 1)/3*100) ?>%"></span></div><span data-sx-step-counter><?= str_pad((string)($activeStep + 1), 2, '0', STR_PAD_LEFT) ?> / 03</span></div>
          <a class="sx-aside-link" href="<?= $h($activeKey === 'interior-design' ? $designerUrl : $bookUrl) ?>" data-sx-aside-link><?= $activeKey === 'interior-design' ? 'Open Cabinet Designer' : 'Discuss this service' ?> <span aria-hidden="true">↗</span></a>
        </aside>
        <div class="sx-process-area">
          <div class="sx-process-cards" data-sx-cards aria-label="Three steps in <?= $h($activeService['name']) ?>">
          <?php foreach ($activeService['steps'] as $i => $step): ?>
            <button class="sx-process-card<?= $i === $activeStep ? ' is-selected' : '' ?>" type="button" data-sx-card="<?= $i ?>" aria-pressed="<?= $i === $activeStep ? 'true' : 'false' ?>" aria-label="Step <?= $i + 1 ?>: <?= $h($step['title']) ?>">
              <span class="sx-card-media">
                <?php if ($step['image']): ?><img src="<?= $h($step['image']) ?>" alt="<?= $h($step['subject']) ?>" loading="lazy" decoding="async" width="600" height="800"><?php else: ?>
                <span class="sx-image-pending" aria-hidden="true"><span class="sx-placeholder-grid"></span><span class="sx-placeholder-arch"></span><span class="sx-placeholder-note">PHOTO PENDING</span><small><?= $h(basename($step['imagePath'])) ?></small></span>
                <?php endif; ?>
              </span>
              <span class="sx-card-shade"></span>
              <span class="sx-card-top"><span>STEP <?= str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT) ?></span><span aria-hidden="true">↗</span></span>
              <span class="sx-card-bottom"><strong><?= $h($step['title']) ?></strong><span class="sx-card-brief"><?= $h($step['doing']) ?></span></span>
            </button>
          <?php endforeach; ?>
          </div>
          <div class="sx-process-toolbar">
            <div class="sx-current-detail" aria-live="polite"><span class="sx-current-marker" data-sx-detail-number>01</span><div><strong data-sx-detail-title><?= $h($activeService['steps'][$activeStep]['title']) ?></strong><p data-sx-detail-expect>What you can expect: <?= $h($activeService['steps'][$activeStep]['expect']) ?></p></div></div>
            <div class="sx-controls"><button type="button" class="sx-control" data-sx-prev-step aria-label="Previous process step" <?= $activeStep === 0 ? 'disabled' : '' ?>>←</button><button type="button" class="sx-control" data-sx-next-step aria-label="Next process step" <?= $activeStep === 2 ? 'disabled' : '' ?>>→</button></div>
          </div>
        </div>
      </div>
      <div class="sx-section-foot"><span>THREE STEPS. A CLEARER DIRECTION.</span><span>CHOOSE A SERVICE TO CONTINUE</span></div>
    </div>
  </section>

  <section class="sx-guidance" id="services-guidance" aria-labelledby="sx-guidance-title">
    <div class="site-wrap sx-guidance-inner">
      <header><p class="sx-overline"><span class="sx-overline-rule"></span> YOUR STARTING POINT</p><h2 id="sx-guidance-title">WHAT ARE <em>YOU PLANNING?</em></h2><p>Not every project needs every service. Tell us what you are planning and explore a suitable starting point.</p></header>
      <div class="sx-guidance-grid">
        <div class="sx-choice-list" role="group" aria-label="What are you planning?">
          <button type="button" class="sx-choice is-selected" data-sx-choice="cabinetry" aria-pressed="true"><span>01</span><strong>Custom Cabinetry</strong><small>Kitchen cabinets, wardrobes or storage.</small></button>
          <button type="button" class="sx-choice" data-sx-choice="interior" aria-pressed="false"><span>02</span><strong>Interior Design</strong><small>A new direction for my interior.</small></button>
          <button type="button" class="sx-choice" data-sx-choice="construction" aria-pressed="false"><span>03</span><strong>Renovation and Construction</strong><small>Building or renovation work.</small></button>
          <button type="button" class="sx-choice" data-sx-choice="unsure" aria-pressed="false"><span>04</span><strong>Not Sure Yet</strong><small>Help deciding where to begin.</small></button>
        </div>
        <aside class="sx-guidance-result" aria-live="polite" aria-atomic="true"><p class="sx-mini-label">SUGGESTED STARTING POINT</p><span class="sx-result-mark" aria-hidden="true">↗</span><h3 data-sx-result-title>Explore your cabinetry layout.</h3><p data-sx-result-copy>Start with a custom layout in the Cabinet Designer, then discuss materials, measurements and the details with our team.</p><div class="sx-result-actions"><a data-sx-result-primary class="sx-btn sx-btn-primary" href="<?= $h($designerUrl) ?>">Open Cabinet Designer <span aria-hidden="true">↗</span></a><a data-sx-result-secondary class="sx-btn sx-btn-quiet" href="<?= $h($bookUrl) ?>">Book consultation <span aria-hidden="true">↗</span></a></div><p class="sx-result-note">Your project can begin at the stage that suits you.</p></aside>
      </div>
    </div>
  </section>
</main>
<script type="application/json" id="sx-services-data"><?= json_encode(['services'=>$services, 'activeService'=>$activeKey, 'activeStep'=>$activeStep, 'bookUrl'=>$bookUrl, 'designerUrl'=>$designerUrl], JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE) ?></script>
<?php require __DIR__ . '/../../includes/customer/footer.php'; ?>
