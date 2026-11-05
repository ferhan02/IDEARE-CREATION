<?php
$pageTitle = 'IDEARE | Architecture, Interior Design & Build';
$pageStyles = ['assets/css/homepage.css', 'assets/css/home-services-story.css'];
$pageScripts = ['assets/js/homepage.js', 'assets/js/home-services-story.js'];
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
