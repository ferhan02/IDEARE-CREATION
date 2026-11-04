<?php
$pageTitle = 'About Us | IDEARE Creation Design & Build';
$pageStyles = ['assets/css/about.css'];
require __DIR__ . '/../../includes/customer/header.php';
?>
<main class="ideare-about-page">
    <section class="ia-hero" aria-labelledby="ia-title">
        <div class="site-wrap ia-hero-layout">
            <div class="ia-hero-copy">
                <p class="eyebrow">Our company · Since 2007</p>
                <h1 id="ia-title">Built on experience.<br><em>Driven by ideas.</em></h1>
                <p class="ia-lead">IDEARE Creation Design and Build is a construction and interior design company bringing design, manufacturing and project delivery together under one roof.</p>
                <div class="ia-hero-actions">
                    <a class="btn primary" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>public/pages/services.php">Explore our services</a>
                    <a class="btn" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>pages/book-appointment.php">Book a consultation</a>
                </div>
            </div>
            <aside class="ia-since" aria-label="Company background">
                <span class="ia-since-label">Established</span>
                <strong>2007<span class="ia-since-dot">.</span></strong>
                <p>27 September 2007</p>
                <div class="ia-since-divider"></div>
                <span>Construction <span aria-hidden="true">/</span> Interior Design <span aria-hidden="true">/</span> In-house Manufacturing</span>
            </aside>
        </div>
    </section>

    <section class="ia-section" aria-labelledby="ia-story-title">
        <div class="site-wrap ia-split">
            <div>
                <p class="eyebrow">01 / Our story</p>
                <h2 id="ia-story-title">From small beginnings to bigger possibilities.</h2>
            </div>
            <div class="ia-prose">
                <p>IDEARE Creation Design and Build began operations on <strong>27 September 2007</strong> as a construction and interior design company. Starting with smaller awarded contracts, we have steadily grown towards medium- and large-scale projects.</p>
                <p>As our business developed, so did our capabilities. Alongside construction and interior design, we provide project management consultancy, project implementation and maintenance management services.</p>
                <p>Our approach remains grounded in practical planning, creative thinking and professional execution — taking every project from its initial requirements through to completion.</p>
            </div>
        </div>
    </section>

    <section class="ia-section ia-tint" aria-labelledby="ia-capabilities-title">
        <div class="site-wrap">
            <div class="ia-section-heading">
                <div>
                    <p class="eyebrow">02 / What we do</p>
                    <h2 id="ia-capabilities-title">One team. More possibilities.</h2>
                </div>
                <p>Our in-house manufacturing and construction capabilities allow us to coordinate key parts of a project within one company.</p>
            </div>
            <div class="ia-capability-grid">
                <article class="ia-capability"><span>01</span><h3>Construction &amp; Development</h3><p>Construction works, project development and implementation.</p></article>
                <article class="ia-capability"><span>02</span><h3>Interior Design</h3><p>Space planning, interior design and coordinated finishing works.</p></article>
                <article class="ia-capability"><span>03</span><h3>Custom Manufacturing</h3><p>In-house cabinetry, roller blinds, curtains, sofas and welding works.</p></article>
                <article class="ia-capability"><span>04</span><h3>Project &amp; Maintenance Management</h3><p>Project management consultancy, implementation oversight and maintenance management.</p></article>
            </div>
        </div>
    </section>

    <section class="ia-section" aria-labelledby="ia-philosophy-title">
        <div class="site-wrap ia-split">
            <div>
                <p class="eyebrow">03 / Our philosophy</p>
                <h2 id="ia-philosophy-title">Innovation, creativity and professionalism.</h2>
            </div>
            <div class="ia-prose">
                <p>Our corporate philosophy is to make the best use of our resources to deliver the construction work entrusted to us. We approach projects with careful feasibility and viability studies, investment appraisal, planning and hands-on management.</p>
                <p>We also embrace relevant construction technology and modern project management methods wherever they can improve results. Our aim is to create lasting value — a <strong>win-win outcome</strong> for our clients, the public and IDEARE.</p>
            </div>
        </div>
    </section>

    <section class="ia-section ia-commitment" aria-labelledby="ia-commitment-title">
        <div class="site-wrap">
            <div class="ia-section-heading">
                <div>
                    <p class="eyebrow">04 / Our commitment</p>
                    <h2 id="ia-commitment-title">What you can expect from us.</h2>
                </div>
                <p>Every project is guided by the same core commitments to time, quality and considered execution.</p>
            </div>
            <div class="ia-commitment-grid">
                <article><span>01 / On schedule</span><h3>Timely delivery</h3><p>We work towards completing each project in line with the agreed schedule.</p></article>
                <article><span>02 / Quality</span><h3>Excellent workmanship</h3><p>We strive for consistently high standards in our work and finishes.</p></article>
                <article><span>03 / Technology</span><h3>Modern methods</h3><p>We use advanced construction methods and technologies wherever practical.</p></article>
            </div>
        </div>
    </section>

    <section class="ia-cta" aria-labelledby="ia-cta-title">
        <div class="site-wrap ia-cta-inner">
            <div><p class="eyebrow">Build with IDEARE</p><h2 id="ia-cta-title">Have a project in mind?</h2><p>From construction to custom interiors, speak with our team about bringing your ideas to life.</p></div>
            <a class="btn primary" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>pages/book-appointment.php">Book a consultation</a>
        </div>
    </section>
</main>
<?php require __DIR__ . '/../../includes/customer/footer.php'; ?>
