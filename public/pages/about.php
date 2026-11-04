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
                <p>As our business developed, so did our capabilities. Alongside construction and interior design, we provide project management consultancy, project implementation and maintenance management services. Our earlier company profile also identifies <strong>Red Hot Builder Sdn Bhd</strong> as a former business name.</p>
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
                <article class="ia-capability"><span>03</span><h3>Custom Manufacturing</h3><p>Made-to-measure cabinetry, sofa and upholstery work, roller blinds, curtains, and metal fabrication.</p></article>
                <article class="ia-capability"><span>04</span><h3>Project &amp; Maintenance Management</h3><p>Project management consultancy, implementation oversight and maintenance management.</p></article>
            </div>
        </div>
    </section>


    <!-- Company profile reference: operational capabilities and company information.
         Older printed branch/headquarters addresses are intentionally omitted pending verification. -->
    <section class="ia-section" aria-labelledby="ia-delivery-title">
        <div class="site-wrap ia-split">
            <div>
                <p class="eyebrow">03 / Our way of working</p>
                <h2 id="ia-delivery-title">From consultation to the finished space.</h2>
            </div>
            <div class="ia-prose">
                <p>We work as a <strong>one-stop centre</strong> for consultation, construction, interior design, custom furniture and finishing works. Our team develops solutions around each client’s space, requirements and budget.</p>
                <p>From early 3D design and material selection to fabrication and installation, our aim is to keep design decisions connected to how the final space will be built and used.</p>
                <p>Our showroom helps clients explore design possibilities and finishes, while our workshop supports the production of made-to-measure cabinetry and interior fittings.</p>
            </div>
        </div>
    </section>

    <section class="ia-section ia-tint" aria-labelledby="ia-production-title">
        <div class="site-wrap">
            <div class="ia-section-heading">
                <div>
                    <p class="eyebrow">04 / Production &amp; finishing</p>
                    <h2 id="ia-production-title">A wider range of work, coordinated under one roof.</h2>
                </div>
                <p>Our company profile highlights a broad mix of construction, interior and production services. Actual project scope and specifications are agreed during consultation.</p>
            </div>
            <div class="ia-capability-grid">
                <article class="ia-capability"><span>01</span><h3>Custom Cabinetry</h3><p>Kitchen cabinets, built-in storage and made-to-measure furniture produced for each space.</p></article>
                <article class="ia-capability"><span>02</span><h3>Sofas &amp; Upholstery</h3><p>Custom sofa and seating design with a focus on comfort, function and interior coordination.</p></article>
                <article class="ia-capability"><span>03</span><h3>Blinds &amp; Curtains</h3><p>Roller and automated blinds, curtains and other window-covering solutions.</p></article>
                <article class="ia-capability"><span>04</span><h3>Aluminium, Glass &amp; Metal</h3><p>Aluminium and glass works alongside welding and related fabrication.</p></article>
                <article class="ia-capability"><span>05</span><h3>Flooring</h3><p>Timber-look and other flooring options selected to suit the use and character of each space.</p></article>
                <article class="ia-capability"><span>06</span><h3>Wall Finishes</h3><p>Wallpaper and decorative wall treatments as part of a coordinated interior scheme.</p></article>
                <article class="ia-capability"><span>07</span><h3>Construction</h3><p>Building and development works, from project preparation to practical completion.</p></article>
                <article class="ia-capability"><span>08</span><h3>3D Design &amp; Consultation</h3><p>Visual planning and design advice tailored to the client’s layout, priorities and budget.</p></article>
            </div>
        </div>
    </section>

    <section class="ia-section" aria-labelledby="ia-philosophy-title">
        <div class="site-wrap ia-split">
            <div>
                <p class="eyebrow">05 / Our philosophy</p>
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
                    <p class="eyebrow">06 / Our commitment</p>
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


    <section class="ia-section" aria-labelledby="ia-details-title">
        <div class="site-wrap ia-split">
            <div>
                <p class="eyebrow">07 / Company information</p>
                <h2 id="ia-details-title">Get to know IDEARE.</h2>
            </div>
            <div class="ia-prose">
                <p><strong>Business name</strong><br>IDEARE Creation Design and Build</p>
                <p><strong>Business registration</strong><br>PG0559039-W <small>(as shown in the company profile)</small></p>
                <p><strong>Established</strong><br>27 September 2007</p>
                <p><strong>Company profile contact</strong><br><a href="tel:+60122267004">012-226 7004</a><br><a href="mailto:idearecreation27@gmail.com">idearecreation27@gmail.com</a></p>
                <p><strong>Visit us</strong><br>For the current office and cabinetry workshop location, please use our <a href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>pages/where-we-are.php">Find Our Location</a> page.</p>
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
