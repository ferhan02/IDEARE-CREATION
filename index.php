<?php
$pageTitle = 'IDEARE | Architecture, Interior Design & Build';
$pageStyles = ['assets/css/homepage.css'];
$pageScripts = ['assets/js/homepage.js'];
require_once __DIR__ . '/includes/staff/feature-tools.php';
$pdo = staff_db();
$featuredProjects = [];
$featuredIdeas = [];

try {
    $featuredProjects = db_rows(
        $pdo,
        'SELECT title,category,short_description,cover_image,location_label
         FROM project_gallery_entries
         WHERE is_published=1
         ORDER BY is_featured DESC,sort_order,completion_date DESC
         LIMIT 3'
    );
} catch (Throwable $e) {}

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

    <section class="section home-section home-services" id="services-overview">
        <div class="site-wrap">
            <div class="home-reveal home-section-heading compact-heading">
                <div>
                    <p class="eyebrow">What we do</p>
                    <h2>From first idea to built space.</h2>
                </div>
            </div>
            <div class="card-grid">
                <article class="card"><h2>Cabinet Design</h2><p>Build a first draft before speaking with the IdeaRE team.</p></article>
                <article class="card"><h2>Custom Interiors</h2><p>Explore layout, finishing, colours and storage possibilities.</p></article>
                <article class="card"><h2>Consultation Workflow</h2><p>Saved designs can be continued by authorized staff inside the same project.</p></article>
            </div>
            <div class="actions section-actions">
                <a class="btn" href="public/pages/services.php">View services</a>
            </div>
        </div>
    </section>

    <section class="section home-section" id="portfolio">
        <div class="site-wrap">
            <div class="home-reveal home-section-heading">
                <div>
                    <p class="eyebrow">Portfolio</p>
                    <h2>Selected IdeaRE projects.</h2>
                </div>
                <p>A look at completed work, design directions and spaces developed by IdeaRE.</p>
            </div>
            <div class="card-grid">
                <?php if ($featuredProjects): ?>
                    <?php foreach ($featuredProjects as $p): ?>
                        <article class="card portfolio-card">
                            <?php if ($p['cover_image']): ?>
                                <img class="portfolio-image" src="<?= h(ideare_root_url($p['cover_image'])) ?>" alt="">
                            <?php else: ?>
                                <div class="project-ph"><?= h($p['category'] ?: 'Project') ?></div>
                            <?php endif; ?>
                            <small><?= h($p['category'] ?: 'Project') ?></small>
                            <h3><?= h($p['title']) ?></h3>
                            <p><?= h($p['short_description'] ?: '') ?></p>
                            <?php if ($p['location_label']): ?><small><?= h($p['location_label']) ?></small><?php endif; ?>
                        </article>
                    <?php endforeach; ?>
                <?php else: ?>
                    <article class="card portfolio-card"><div class="project-ph">Kitchen</div><small>Kitchen</small><h3>Modern Kitchen</h3><p>Clean lines, practical storage and a layout built around daily use.</p></article>
                    <article class="card portfolio-card"><div class="project-ph">Wardrobe</div><small>Wardrobe</small><h3>Built-in Wardrobe</h3><p>Tailored internal storage with a fitted, architectural finish.</p></article>
                    <article class="card portfolio-card"><div class="project-ph">Living</div><small>Living</small><h3>Living Storage</h3><p>Integrated cabinetry designed to feel like part of the room.</p></article>
                <?php endif; ?>
            </div>
        </div>
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
