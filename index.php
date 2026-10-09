<?php
$pageTitle='IdeaRE | Home';
require_once __DIR__.'/includes/staff/feature-tools.php';
$pdo=staff_db();
$featuredProjects=[];
$featuredIdeas=[];

try{
    $featuredProjects=db_rows(
        $pdo,
        'SELECT title,category,short_description,cover_image,location_label
         FROM project_gallery_entries
         WHERE is_published=1
         ORDER BY is_featured DESC,sort_order,completion_date DESC
         LIMIT 3'
    );
}catch(Throwable $e){}

try{
    $featuredIdeas=db_rows(
        $pdo,
        'SELECT id,title,style_name,room_type,description,cover_image,base_design_id
         FROM inspiration_designs
         WHERE is_published=1
         ORDER BY is_featured DESC,sort_order,created_at DESC
         LIMIT 3'
    );
}catch(Throwable $e){}

require __DIR__.'/includes/customer/header.php';
?>
<main>
<section class="hero">
    <div class="site-wrap hero-grid">
        <div>
            <p class="eyebrow">IdeaRE</p>
            <h1>Plan your space before the consultation.</h1>
            <p class="lead">
                Explore IdeaRE services, browse real projects and cabinet ideas, then use the Cabinet Designer to build a first draft before your consultation.
            </p>
            <div class="actions">
                <a class="btn primary" href="designer/index.php">Try Cabinet Designer</a>
                <a class="btn" href="pages/book-appointment.php">Book Appointment</a>
            </div>
        </div>
        <div class="hero-card">
            <div class="mini-cabinet"><i></i><i></i></div>
            <b>Interactive cabinet planning</b>
            <span>Your design can continue into quotation, costing and production inside the IdeaRE system.</span>
        </div>
    </div>
</section>

<section class="section home-section" id="about">
    <div class="site-wrap">
        <div class="home-section-heading">
            <div>
                <p class="eyebrow">About IdeaRE</p>
                <h2>Designed around how you actually live.</h2>
            </div>
            <p>
                IdeaRE brings cabinet design, interior planning and project coordination into one clear journey — from the first idea to the final installation.
            </p>
        </div>

        <div class="about-grid">
            <article class="card about-card">
                <span class="about-number">01</span>
                <h3>Understand the space</h3>
                <p>We begin with how the room is used, what needs to be stored and the measurements that shape the design.</p>
            </article>
            <article class="card about-card">
                <span class="about-number">02</span>
                <h3>Design with intention</h3>
                <p>Layouts, cabinet combinations, finishes and practical details are developed around the customer instead of forcing a one-size-fits-all solution.</p>
            </article>
            <article class="card about-card">
                <span class="about-number">03</span>
                <h3>Carry the idea through</h3>
                <p>The same project can continue from design into quotation, material planning, production and installation without starting over.</p>
            </article>
        </div>
    </div>
</section>

<section class="section home-section home-services" id="services-overview">
    <div class="site-wrap">
        <div class="home-section-heading compact-heading">
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
        <div class="home-section-heading">
            <div>
                <p class="eyebrow">Portfolio</p>
                <h2>Selected IdeaRE projects.</h2>
            </div>
            <p>A look at completed work, design directions and spaces developed by IdeaRE.</p>
        </div>

        <div class="card-grid">
            <?php if($featuredProjects): ?>
                <?php foreach($featuredProjects as $p): ?>
                    <article class="card portfolio-card">
                        <?php if($p['cover_image']): ?>
                            <img class="portfolio-image" src="<?=h(ideare_root_url($p['cover_image']))?>" alt="">
                        <?php else: ?>
                            <div class="project-ph"><?=h($p['category']?:'Project')?></div>
                        <?php endif; ?>
                        <small><?=h($p['category']?:'Project')?></small>
                        <h3><?=h($p['title'])?></h3>
                        <p><?=h($p['short_description']?:'')?></p>
                        <?php if($p['location_label']): ?><small><?=h($p['location_label'])?></small><?php endif; ?>
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

<?php if($featuredIdeas): ?>
<section class="section home-section">
    <div class="site-wrap">
        <div class="home-section-heading">
            <div>
                <p class="eyebrow">Get inspired</p>
                <h2>Cabinet Inspiration</h2>
            </div>
            <p>Start with an IdeaRE concept, then adapt it in the Cabinet Designer.</p>
        </div>
        <div class="card-grid">
            <?php foreach($featuredIdeas as $p): ?>
                <article class="card portfolio-card">
                    <?php if($p['cover_image']): ?><img class="portfolio-image" src="<?=h(ideare_root_url($p['cover_image']))?>" alt=""><?php endif; ?>
                    <small><?=h(($p['style_name']?:'IdeaRE').' · '.($p['room_type']?:''))?></small>
                    <h3><?=h($p['title'])?></h3>
                    <p><?=h($p['description']?:'')?></p>
                    <a class="btn" href="<?=h(ideare_root_url('designer/index.php'.($p['base_design_id']?'?design_id='.$p['base_design_id']:'')))?>">Customize this design</a>
                </article>
            <?php endforeach; ?>
        </div>
        <div class="actions section-actions"><a class="btn" href="pages/inspiration.php">Browse inspiration</a></div>
    </div>
</section>
<?php endif; ?>

<section class="section home-section contact-section" id="contact">
    <div class="site-wrap contact-grid">
        <div class="contact-copy">
            <p class="eyebrow">Contact us</p>
            <h2>Tell us what you are planning.</h2>
            <p class="lead">
                Share the room, the type of cabinet or interior work you have in mind, and where you are in the planning process.
            </p>
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
<?php require __DIR__.'/includes/customer/footer.php'; ?>
