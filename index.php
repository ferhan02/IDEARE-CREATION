<?php
$pageTitle = 'IDEARE | Architecture, Interior Design & Build';
$pageStyles = ['assets/css/homepage.css', 'assets/css/home-services-story.css', 'assets/css/home-portfolio.css'];
$pageScripts = ['assets/js/homepage.js']; // The responsive device controllers manage the five-stage story.
require_once __DIR__ . '/includes/staff/feature-tools.php';
$pdo = staff_db();
$featuredIdeas = [];
// Project exhibition artwork is read from the named image folders below.
// Staff demo gallery entries are intentionally not presented as client projects.

try {
    $featuredIdeas = db_rows(
        $pdo,
        'SELECT id,title,style_name,room_type,description,cover_image,base_design_id
         FROM inspiration_designs
         WHERE is_published=1
         ORDER BY is_featured DESC,sort_order,created_at DESC
         LIMIT 3'
    );
} catch (Throwable $e) {}

// The public exhibition is curated independently of staff demo entries.
// Add images to the named folders; the gallery automatically discovers them.
$portfolioProjects = [
    ['folder' => 'Cafe Shop at Hartamas', 'title' => 'Café Shop at Hartamas', 'category' => 'Food & Beverage', 'place' => 'Hartamas'],
    ['folder' => 'Concorde, Shah Alam', 'title' => 'Concorde Hotel', 'category' => 'Hospitality', 'place' => 'Shah Alam'],
    ['folder' => 'Free Duty Shop at KLIA 2', 'title' => 'Free Duty Shop at KLIA 2', 'category' => 'Retail', 'place' => 'KLIA 2'],
    ['folder' => 'Getthis Cyberjaya', 'title' => 'Getthis Cyberjaya', 'category' => 'Retail & Commercial', 'place' => 'Cyberjaya'],
    ['folder' => 'Kilang Yakult', 'title' => 'Kilang Yakult', 'category' => 'Commercial', 'place' => 'Malaysia'],
    ['folder' => 'Klana Resort, Seremban', 'title' => 'Klana Resort', 'category' => 'Hospitality', 'place' => 'Seremban'],
    ['folder' => 'Kooceng Cat Hotel & Spa', 'title' => 'Kooceng Cat Hotel & Spa', 'category' => 'Hospitality', 'place' => 'Malaysia'],
    ['folder' => "Masjid Dato' Klana Petra Undang Luak Sungai Ujong", 'title' => "Masjid Dato' Klana Petra", 'category' => 'Cultural & Community', 'place' => 'Negeri Sembilan'],
    ['folder' => 'Naelofar Hijab', 'title' => 'Naelofar Hijab', 'category' => 'Retail', 'place' => 'Malaysia'],
    ['folder' => 'Panggung Bangsawan Melaka', 'title' => 'Panggung Bangsawan', 'category' => 'Cultural & Community', 'place' => 'Melaka'],
    ['folder' => 'Subang Jaya Medical Centre', 'title' => 'Subang Jaya Medical Centre', 'category' => 'Healthcare', 'place' => 'Subang Jaya'],
];
foreach ($portfolioProjects as &$portfolioProject) {
    $portfolioProject['photos'] = [];
    $folder = $portfolioProject['folder'];
    $absoluteFolder = __DIR__ . '/assets/images/portfolio/' . $folder;
    if (!is_dir($absoluteFolder)) {
        continue;
    }
    $names = scandir($absoluteFolder);
    if (!is_array($names)) {
        continue;
    }
    natcasesort($names);
    foreach ($names as $file) {
        if ($file === '.' || $file === '..' || !is_file($absoluteFolder . '/' . $file)) {
            continue;
        }
        if (!in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), ['jpg','jpeg','png','webp','avif'], true)) {
            continue;
        }
        $portfolioProject['photos'][] = [
            'src' => 'assets/images/portfolio/' . rawurlencode($folder) . '/' . rawurlencode($file),
            'label' => trim(str_replace(['_', '-'], ' ', pathinfo($file, PATHINFO_FILENAME))),
        ];
    }
}
unset($portfolioProject);

require __DIR__ . '/includes/customer/header.php';
?>
<main>
    <!-- HOME: Full-bleed photograph is loaded from assets/images/Homepage Hero.png. -->
    <section class="home-hero" id="home" aria-labelledby="home-hero-title">
        <div class="site-wrap home-hero-inner">
            <div class="home-hero-copy">
                <p class="home-hero-kicker">IDEARE <span aria-hidden="true">/</span> Architecture &amp; Interior Design</p>
                <h1 id="home-hero-title">Spaces that inspire.<br><span>Built to belong.</span></h1>
                <p class="home-hero-lead">From architecture and construction to bespoke interiors and furnishings, we bring every part of your vision together.</p>
                <div class="actions home-hero-actions">
                    <a class="btn primary" href="#portfolio">Explore Our Projects</a>
                    <a class="btn home-hero-ghost" href="#about">Discover IDEARE <span aria-hidden="true">↗</span></a>
                </div>
            </div>
            <a class="home-hero-scroll" href="#about" aria-label="Scroll to learn about IDEARE">
                <span class="home-hero-scroll-line" aria-hidden="true"></span>
                <span>Scroll to explore</span>
            </a>
        </div>
    </section>

    <!-- ABOUT: Matched architectural photographs crossfade via the existing theme toggle. -->
    <section class="home-studio home-section" id="about" aria-labelledby="home-about-title">
        <div class="studio-photo studio-photo-light" aria-hidden="true"></div>
        <div class="studio-photo studio-photo-dark" aria-hidden="true"></div>
        <div class="studio-image-wash" aria-hidden="true"></div>
        <div class="site-wrap studio-content">
            <div class="studio-story home-reveal">
                <p class="studio-eyebrow">Our company <span aria-hidden="true">·</span> Since 2007</p>
                <h2 id="home-about-title">Built on<br>experience.<br><span>Driven by ideas.</span></h2>
                <p class="studio-description">IDEARE Creation Design and Build brings construction, interior design and in-house manufacturing together under one roof — from the first concept to the finished space.</p>
                <div class="actions studio-actions">
                    <a class="btn primary" href="public/pages/about.php">See More <span aria-hidden="true">↗</span></a>
                </div>
            </div>
            <aside class="studio-established home-reveal" aria-label="Established 27 September 2007">
                <span class="studio-established-label">Established</span>
                <strong>2007<span>.</span></strong>
                <p>27 September 2007</p>
                <div class="studio-established-rule"></div>
                <span class="studio-established-detail">Construction <span aria-hidden="true">/</span> Interior Design <span aria-hidden="true">/</span> In-house Manufacturing</span>
            </aside>
        </div>
    </section>

    <!-- SERVICES: A five-chapter architectural story driven by vertical scroll. -->
    <section class="service-story home-section" id="services-overview" aria-labelledby="service-story-heading">
        <div class="service-story-opening">
            <div class="site-wrap service-story-opening-grid">
                <div class="home-reveal">
                    <p class="service-story-overline">What we do <span aria-hidden="true">/</span> The IDEARE approach</p>
                    <h2 id="service-story-heading">One vision.<br><span>Five disciplines.</span></h2>
                </div>
                <div class="service-story-opening-side home-reveal">
                    <span class="service-story-opening-line" aria-hidden="true"></span>
                    <p>From the first conversation to the finishing touches, discover how our services come together to create a space that's uniquely yours.</p>
                    <span class="service-story-opening-hint">Scroll to explore our expertise <span aria-hidden="true">↓</span></span>
                </div>
            </div>
        </div>

        <div class="service-story-runway" data-service-runway>
            <div class="service-story-sticky" data-service-sticky>
                <div class="service-story-backdrop" aria-hidden="true"></div>
                <div class="service-story-topline" aria-hidden="true">
                    <span>IDEARE <b>/</b> SERVICES</span>
                    <span>DESIGN <b>·</b> BUILD <b>·</b> CREATE</span>
                </div>

                <div class="service-story-stages" data-service-stages>
                    <article class="service-story-stage" data-service-stage="0" aria-labelledby="service-title-01">
                        <div class="service-story-stage-inner">
                            <div class="service-story-copy">
                                <span class="service-story-index">01 <small>/ 05</small></span>
                                <p class="service-story-category"><span class="service-story-category-line"></span> Consultation</p>
                                <h3 id="service-title-01">Every great space<br>begins with <em>a conversation.</em></h3>
                                <p class="service-story-description">We listen before we design. Our consultation brings together your needs, priorities, budget and vision, so every decision has a clear purpose from day one.</p>
                                <p class="service-story-keywords">Project briefing <span>·</span> Site understanding <span>·</span> Practical advice</p>
                            </div>
                            <figure class="service-story-photo">
                                <img src="assets/images/home-services/consultation.webp" alt="IDEARE design consultation with clients reviewing kitchen plans and material samples" width="1254" height="1254" loading="eager" decoding="async">
                                <figcaption><span>01 / DISCOVER</span><span>UNDERSTAND THE VISION</span></figcaption>
                            </figure>
                        </div>
                    </article>

                    <article class="service-story-stage" data-service-stage="1" aria-labelledby="service-title-02">
                        <div class="service-story-stage-inner">
                            <div class="service-story-copy">
                                <span class="service-story-index">02 <small>/ 05</small></span>
                                <p class="service-story-category"><span class="service-story-category-line"></span> 3D Design &amp; Visualisation</p>
                                <h3 id="service-title-02">See your ideas<br><em>come to life.</em></h3>
                                <p class="service-story-description">Our 3D design process helps you experience the layout, proportions, finishes and atmosphere before work begins. Refine the details with confidence, not guesswork.</p>
                                <p class="service-story-keywords">3D visualisation <span>·</span> Layout exploration <span>·</span> Material selection</p>
                            </div>
                            <figure class="service-story-photo">
                                <img src="assets/images/home-services/3d-design.webp" alt="IDEARE designer creating a detailed three-dimensional kitchen design on a computer" width="1254" height="1254" loading="eager" decoding="async">
                                <figcaption><span>02 / VISUALISE</span><span>DESIGN BEFORE YOU BUILD</span></figcaption>
                            </figure>
                        </div>
                    </article>

                    <article class="service-story-stage" data-service-stage="2" aria-labelledby="service-title-03">
                        <div class="service-story-stage-inner">
                            <div class="service-story-copy">
                                <span class="service-story-index">03 <small>/ 05</small></span>
                                <p class="service-story-category"><span class="service-story-category-line"></span> Construction</p>
                                <h3 id="service-title-03">From foundation<br>to <em>finishing.</em></h3>
                                <p class="service-story-description">More than beautiful concepts, we deliver building work. From site preparation and structural works to coordinated installation and finishing, we manage the details that make a project real.</p>
                                <p class="service-story-keywords">Building works <span>·</span> Project coordination <span>·</span> Quality workmanship</p>
                            </div>
                            <figure class="service-story-photo">
                                <img src="assets/images/home-services/construction.webp" alt="IDEARE construction team working and reviewing drawings at an active building site" width="1254" height="1254" loading="eager" decoding="async">
                                <figcaption><span>03 / BUILD</span><span>TURN IDEAS INTO REALITY</span></figcaption>
                            </figure>
                        </div>
                    </article>

                    <article class="service-story-stage" data-service-stage="3" aria-labelledby="service-title-04">
                        <div class="service-story-stage-inner">
                            <div class="service-story-copy">
                                <span class="service-story-index">04 <small>/ 05</small></span>
                                <p class="service-story-category"><span class="service-story-category-line"></span> Interior Design</p>
                                <h3 id="service-title-04">Spaces that feel<br><em>like you.</em></h3>
                                <p class="service-story-description">We bring form and function together through considered layouts, lighting, colours, textures and bespoke detailing. Every element has a place, and every space has a story.</p>
                                <p class="service-story-keywords">Space planning <span>·</span> Interior finishes <span>·</span> Design detailing</p>
                            </div>
                            <figure class="service-story-photo">
                                <img src="assets/images/home-services/interior-design.webp" alt="IDEARE interior design team reviewing a furnished residential space and architectural drawings" width="1254" height="1254" loading="eager" decoding="async">
                                <figcaption><span>04 / REFINE</span><span>DESIGNED FOR LIVING</span></figcaption>
                            </figure>
                        </div>
                    </article>

                    <article class="service-story-stage" data-service-stage="4" aria-labelledby="service-title-05">
                        <div class="service-story-stage-inner">
                            <div class="service-story-copy">
                                <span class="service-story-index">05 <small>/ 05</small></span>
                                <p class="service-story-category"><span class="service-story-category-line"></span> Custom Cabinetry &amp; Furniture</p>
                                <h3 id="service-title-05">Thoughtfully designed.<br><em>Made to fit.</em></h3>
                                <p class="service-story-description">Our in-house manufacturing capabilities bring custom cabinetry and furniture into the same design-and-build journey. From made-to-measure storage to sofas, curtains and blinds, the final details are personal.</p>
                                <p class="service-story-keywords">Custom cabinetry <span>·</span> Furniture <span>·</span> In-house production</p>
                            </div>
                            <figure class="service-story-photo">
                                <img src="assets/images/home-services/custom-cabinetry.webp" alt="IDEARE cabinetry installers fitting custom kitchen cupboards at a residential project" width="1254" height="1254" loading="eager" decoding="async">
                                <figcaption><span>05 / CRAFT</span><span>MADE FOR YOUR SPACE</span></figcaption>
                            </figure>
                        </div>
                    </article>
                </div>

                <nav class="service-story-nav" aria-label="Jump to a service stage" data-service-nav>
                    <span class="service-story-nav-track" aria-hidden="true"><span class="service-story-nav-fill"></span></span>
                    <button class="service-story-nav-item" type="button" data-service-jump="0" aria-label="Go to Consultation" aria-current="step"><span>01</span><span class="service-story-nav-name">Consultation</span></button>
                    <button class="service-story-nav-item" type="button" data-service-jump="1" aria-label="Go to 3D Design"><span>02</span><span class="service-story-nav-name">3D Design</span></button>
                    <button class="service-story-nav-item" type="button" data-service-jump="2" aria-label="Go to Construction"><span>03</span><span class="service-story-nav-name">Construction</span></button>
                    <button class="service-story-nav-item" type="button" data-service-jump="3" aria-label="Go to Interior Design"><span>04</span><span class="service-story-nav-name">Interior Design</span></button>
                    <button class="service-story-nav-item" type="button" data-service-jump="4" aria-label="Go to Custom Cabinetry and Furniture"><span>05</span><span class="service-story-nav-name">Cabinetry</span></button>
                </nav>
                <div class="service-story-scroll-note" aria-hidden="true"><span></span> SCROLL TO CONTINUE</div>
            </div>
        </div>

        <div class="service-story-outro">
            <div class="site-wrap service-story-outro-inner">
                <div>
                    <p class="service-story-outro-label">ONE TEAM, ONE JOURNEY</p>
                    <h3>Ready to bring it all together?</h3>
                </div>
                <div class="service-story-outro-actions">
                    <a class="btn primary" href="public/pages/services.php">Explore All Services <span aria-hidden="true">↗</span></a>
                    <a class="btn" href="pages/book-appointment.php">Book a Consultation</a>
                </div>
            </div>
        </div>
    </section>

    <!-- PORTFOLIO: Unpinned horizontal exhibition; photos are discovered from project folders. -->
    <section class="portfolio-exhibition home-section" id="portfolio" aria-labelledby="portfolio-heading" data-portfolio-gallery>
        <div class="portfolio-exhibition-grain" aria-hidden="true"></div>
        <div class="site-wrap portfolio-exhibition-header">
            <div class="portfolio-exhibition-intro home-reveal">
                <p class="portfolio-exhibition-kicker">IDEARE <span aria-hidden="true">/</span> Selected works</p>
                <h2 id="portfolio-heading">Spaces with<br><em>a story to tell.</em></h2>
            </div>
            <div class="portfolio-exhibition-intro-side home-reveal">
                <p>From distinctive destinations to thoughtfully crafted interiors. Explore a selection of spaces we've helped bring to life.</p>
                <div class="portfolio-exhibition-meta"><span>THE PROJECT COLLECTION</span><strong><?= sprintf('%02d', count($portfolioProjects)) ?> PROJECTS</strong></div>
            </div>
        </div>

        <div class="portfolio-exhibition-band" aria-label="Project highlights">
            <div class="portfolio-exhibition-viewport" data-portfolio-viewport>
                <div class="portfolio-exhibition-track" data-portfolio-track>
                    <div class="portfolio-exhibition-group" data-portfolio-group>
                        <?php foreach ($portfolioProjects as $portfolioIndex => $portfolioProject): ?>
                        <?php
                            $portfolioPhotos = $portfolioProject['photos'];
                            $portfolioFirstPhoto = $portfolioPhotos[0] ?? null;
                            $portfolioPhotoCount = count($portfolioPhotos);
                            $portfolioJSON = htmlspecialchars(json_encode($portfolioPhotos, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_QUOT | JSON_HEX_APOS), ENT_QUOTES, 'UTF-8');
                            $portfolioTitle = htmlspecialchars($portfolioProject['title'], ENT_QUOTES, 'UTF-8');
                        ?>
                        <article class="portfolio-exhibit-card" data-portfolio-card data-project-index="<?= $portfolioIndex ?>" data-project-photos="<?= $portfolioJSON ?>">
                            <div class="portfolio-exhibit-media" data-photo-stage>
                                <?php if ($portfolioFirstPhoto): ?>
                                    <img class="portfolio-exhibit-backdrop" src="<?= htmlspecialchars($portfolioFirstPhoto['src'], ENT_QUOTES, 'UTF-8') ?>" alt="" aria-hidden="true" loading="lazy" decoding="async">
                                    <img class="portfolio-exhibit-image" src="<?= htmlspecialchars($portfolioFirstPhoto['src'], ENT_QUOTES, 'UTF-8') ?>" alt="<?= $portfolioTitle ?> — <?= htmlspecialchars($portfolioFirstPhoto['label'], ENT_QUOTES, 'UTF-8') ?>" loading="lazy" decoding="async">
                                <?php else: ?>
                                    <div class="portfolio-exhibit-empty" aria-label="Project photographs coming soon">
                                        <span class="portfolio-empty-mark" aria-hidden="true">I <b>D</b> E A R E</span>
                                        <span class="portfolio-empty-line" aria-hidden="true"></span>
                                        <span class="portfolio-empty-title">PHOTOGRAPHY<br>COMING SOON</span>
                                    </div>
                                <?php endif; ?>
                                <span class="portfolio-exhibit-photo-name" data-photo-label><?= $portfolioFirstPhoto ? htmlspecialchars($portfolioFirstPhoto['label'], ENT_QUOTES, 'UTF-8') : 'Project highlight' ?></span>
                                <span class="portfolio-exhibit-number" aria-hidden="true"><?= sprintf('%02d', $portfolioIndex + 1) ?></span>
                                <?php if ($portfolioPhotoCount > 1): ?>
                                <div class="portfolio-photo-navigation" aria-label="Photographs for <?= $portfolioTitle ?>">
                                    <button class="portfolio-photo-arrow" type="button" data-photo-direction="-1" aria-label="Previous photo of <?= $portfolioTitle ?>" title="Previous project photo"><span aria-hidden="true">←</span></button>
                                    <span class="portfolio-photo-counter" data-photo-counter aria-live="off">01 / <?= sprintf('%02d', $portfolioPhotoCount) ?></span>
                                    <button class="portfolio-photo-arrow" type="button" data-photo-direction="1" aria-label="Next photo of <?= $portfolioTitle ?>" title="Next project photo"><span aria-hidden="true">→</span></button>
                                </div>
                                <?php else: ?>
                                <span class="portfolio-photo-count-static"><?= $portfolioPhotoCount === 1 ? '01 / 01' : 'AWAITING IMAGES' ?></span>
                                <?php endif; ?>
                            </div>
                            <div class="portfolio-exhibit-caption">
                                <div class="portfolio-exhibit-name-line">
                                    <h3><?= $portfolioTitle ?></h3>
                                    <span aria-hidden="true" class="portfolio-exhibit-decoration">↗</span>
                                </div>
                                <div class="portfolio-exhibit-caption-meta">
                                    <span><?= htmlspecialchars($portfolioProject['category'], ENT_QUOTES, 'UTF-8') ?></span>
                                    <span><?= htmlspecialchars($portfolioProject['place'], ENT_QUOTES, 'UTF-8') ?></span>
                                </div>
                            </div>
                        </article>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </div>
        <div class="site-wrap portfolio-exhibition-footer">
            <div class="portfolio-exhibition-status" role="status" aria-live="polite">
                <span class="portfolio-status-caption">CURRENT EXHIBIT</span>
                <strong data-portfolio-active>01 <span>/ <?= sprintf('%02d', count($portfolioProjects)) ?></span></strong>
                <span class="portfolio-current-title" data-portfolio-current-title><?= htmlspecialchars($portfolioProjects[0]['title'], ENT_QUOTES, 'UTF-8') ?></span>
            </div>
            <div class="portfolio-exhibition-controls">
                <span class="portfolio-exhibition-motion-label" data-portfolio-motion-label>CONTINUOUS EXHIBITION</span>
                <button class="portfolio-exhibition-btn" type="button" data-portfolio-prev aria-label="Previous project"><span aria-hidden="true">←</span></button>
                <button class="portfolio-exhibition-btn" type="button" data-portfolio-next aria-label="Next project"><span aria-hidden="true">→</span></button>
            </div>
        </div>
        <div class="site-wrap portfolio-exhibition-progress" aria-hidden="true"><span data-portfolio-progress></span></div>
        <div class="portfolio-exhibition-outro" aria-hidden="true"></div>
    </section>

    <?php if ($featuredIdeas): ?>
    <section class="section home-section" id="inspiration">
        <div class="site-wrap">
            <div class="home-reveal home-section-heading">
                <div>
                    <p class="eyebrow">Get inspired</p>
                    <h2>Cabinet Inspiration</h2>
                </div>
                <p>Start with an IdeaRE concept, then adapt it in the Cabinet Designer.</p>
            </div>
            <div class="card-grid">
                <?php foreach ($featuredIdeas as $p): ?>
                    <article class="card portfolio-card">
                        <?php if ($p['cover_image']): ?><img class="portfolio-image" src="<?= h(ideare_root_url($p['cover_image'])) ?>" alt=""><?php endif; ?>
                        <small><?= h(($p['style_name'] ?: 'IdeaRE') . ' · ' . ($p['room_type'] ?: '')) ?></small>
                        <h3><?= h($p['title']) ?></h3>
                        <p><?= h($p['description'] ?: '') ?></p>
                        <a class="btn" href="<?= h(ideare_root_url('designer/index.php' . ($p['base_design_id'] ? '?design_id=' . $p['base_design_id'] : ''))) ?>">Customize this design</a>
                    </article>
                <?php endforeach; ?>
            </div>
            <div class="actions section-actions"><a class="btn" href="pages/inspiration.php">Browse inspiration</a></div>
        </div>
    </section>
    <?php endif; ?>

    <!-- The header lists Materials before Cabinet Designer; the homepage now follows that sequence. -->
    <section class="section home-section home-materials" id="materials-overview">
        <div class="site-wrap home-materials-grid home-reveal">
            <div>
                <p class="eyebrow">Materials &amp; finishes</p>
                <h2>Every detail starts with the right material.</h2>
                <p>Explore HPL finishes and stone surfaces to find the palette that feels right for your space.</p>
            </div>
            <div class="home-materials-link-wrap">
                <a class="btn" href="material-catalogue.php">Explore Materials <span aria-hidden="true">↗</span></a>
            </div>
        </div>
    </section>

    <!-- Former top hero content moved to the Cabinet Designer position. -->
    <section class="section home-section home-designer" id="cabinet-designer">
        <div class="site-wrap home-designer-grid home-reveal">
            <div class="home-designer-copy">
                <p class="eyebrow">Cabinet Designer</p>
                <h2>Plan your space before the consultation.</h2>
                <p class="lead">Explore IdeaRE services, browse real projects and cabinet ideas, then use the Cabinet Designer to build a first draft before your consultation.</p>
                <div class="actions">
                    <a class="btn primary" href="designer/index.php">Try Cabinet Designer</a>
                    <a class="btn" href="pages/book-appointment.php">Book Appointment</a>
                </div>
            </div>
            <div class="hero-card home-designer-card">
                <div class="mini-cabinet"><i></i><i></i></div>
                <b>Interactive cabinet planning</b>
                <span>Your design can continue into quotation, costing and production inside the IdeaRE system.</span>
            </div>
        </div>
    </section>

    <section class="section home-section contact-section" id="contact">
        <div class="site-wrap contact-grid">
            <div class="contact-copy">
                <p class="eyebrow">Contact us</p>
                <h2>Tell us what you are planning.</h2>
                <p class="lead">Share the room, the type of cabinet or interior work you have in mind, and where you are in the planning process.</p>
                <div class="contact-points">
                    <div><strong>Have measurements already?</strong><span>Bring them into the conversation so the team can move faster.</span></div>
                    <div><strong>Still exploring ideas?</strong><span>Use the Cabinet Designer first and bring your saved concept to the consultation.</span></div>
                </div>
                <div class="actions">
                    <a class="btn primary" href="pages/book-appointment.php">Book Appointment</a>
                    <a class="btn" href="designer/index.php">Open Cabinet Designer</a>
                </div>
            </div>
            <section class="card contact-card" aria-labelledby="contact-form-title">
                <p class="eyebrow">Project enquiry</p>
                <h3 id="contact-form-title">Start the conversation</h3>
                <form>
                    <label>Name<input type="text" autocomplete="name"></label>
                    <div class="two">
                        <label>Email<input type="email" autocomplete="email"></label>
                        <label>Phone<input type="text" autocomplete="tel"></label>
                    </div>
                    <label>Tell us about your project<textarea rows="6" placeholder="Kitchen, wardrobe, room size, preferred style, timeline..."></textarea></label>
                    <button class="btn primary" type="button">Send enquiry</button>
                </form>
                <p class="muted contact-note">Enquiry submission is still a prototype. Use Book Appointment for the current working contact flow.</p>
            </section>
        </div>
    </section>
</main>
<?php require __DIR__ . '/includes/customer/footer.php'; ?>
