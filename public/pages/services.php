<?php
$pageTitle = 'IdeaRE | End-to-End Services';
$pageStyles = ['assets/css/services.css'];
$pageScripts = ['assets/js/services.js'];
require __DIR__ . '/../../includes/customer/header.php';
?>

<main class="services-page" id="services-top">
    <section class="services-hero">
        <div class="site-wrap services-hero-grid">
            <div class="services-hero-copy">
                <p class="eyebrow">End-to-end project delivery</p>
                <h1>From the first site visit to a space that is ready to occupy.</h1>
                <p class="lead">
                    IdeaRE can coordinate the full project journey — pre-construction, design, approvals, building works, MEP, interior fit-out, custom cabinetry, furniture, testing, cleaning and final handover.
                </p>
                <div class="actions">
                    <a class="btn primary" href="<?= $customerRoot ?>pages/book-appointment.php">Discuss your project</a>
                    <a class="btn" href="#project-journey">Explore the full journey</a>
                </div>
                <div class="services-hero-points" aria-label="IdeaRE project delivery highlights">
                    <span>Pre-construction to handover</span>
                    <span>Architecture + interior + construction</span>
                    <span>Custom furniture included</span>
                    <span>Move-in-ready outcome</span>
                </div>
            </div>

            <!-- PHOTO SLOT 01: Best used for a completed IdeaRE exterior/interior hero image. -->
            <figure class="service-photo-placeholder service-photo-hero" aria-label="Future completed project photo">
                <div class="service-photo-mark" aria-hidden="true">01</div>
                <figcaption>
                    <strong>Hero project photo</strong>
                    <span>Use a completed, fully furnished IdeaRE project that immediately communicates “ready to occupy”.</span>
                </figcaption>
            </figure>
        </div>
    </section>

    <section class="services-intro section">
        <div class="site-wrap services-intro-grid">
            <div>
                <p class="eyebrow">One coordinated journey</p>
                <h2>We do more than design a room.</h2>
            </div>
            <div class="services-intro-copy">
                <p>
                    The goal is to remove the gaps between planning, construction and finishing. Instead of handing the owner an unfinished shell, the project can continue through the practical details that make the property usable — from structure and services to cabinets, furniture, lighting, sanitary fittings and final cleaning.
                </p>
                <p class="muted">
                    Exact scope depends on the project, site conditions, local authority requirements and the consultants or specialist contractors that need to be appointed.
                </p>
            </div>
        </div>

        <div class="site-wrap services-capability-grid" aria-label="IdeaRE service capabilities">
            <article class="service-capability">
                <span class="service-capability-no">A</span>
                <h3>Plan</h3>
                <p>Briefing, surveys, feasibility, concept design, working drawings, costing, scheduling and approvals coordination.</p>
            </article>
            <article class="service-capability">
                <span class="service-capability-no">B</span>
                <h3>Build</h3>
                <p>Site works, foundations, structure, walls, roofing, MEP systems, waterproofing and external development.</p>
            </article>
            <article class="service-capability">
                <span class="service-capability-no">C</span>
                <h3>Finish</h3>
                <p>Interior construction, surfaces, lighting, sanitary fixtures, custom cabinets, loose furniture and styling.</p>
            </article>
            <article class="service-capability">
                <span class="service-capability-no">D</span>
                <h3>Handover</h3>
                <p>Testing, snagging, rectification, final cleaning, documentation, walkthrough and move-in readiness.</p>
            </article>
        </div>
    </section>

    <section class="services-journey" id="project-journey" aria-labelledby="journey-title">
        <div class="services-phase-nav-wrap">
            <div class="site-wrap services-phase-nav" aria-label="Project stages">
                <a href="#phase-01" data-phase-link="phase-01"><span>01</span> Pre-construction</a>
                <a href="#phase-02" data-phase-link="phase-02"><span>02</span> Design & approvals</a>
                <a href="#phase-03" data-phase-link="phase-03"><span>03</span> Foundations</a>
                <a href="#phase-04" data-phase-link="phase-04"><span>04</span> Structure</a>
                <a href="#phase-05" data-phase-link="phase-05"><span>05</span> MEP</a>
                <a href="#phase-06" data-phase-link="phase-06"><span>06</span> Interiors</a>
                <a href="#phase-07" data-phase-link="phase-07"><span>07</span> Furniture</a>
                <a href="#phase-08" data-phase-link="phase-08"><span>08</span> External works</a>
                <a href="#phase-09" data-phase-link="phase-09"><span>09</span> Handover</a>
            </div>
        </div>

        <div class="site-wrap services-journey-head">
            <p class="eyebrow">The complete project journey</p>
            <h2 id="journey-title">Everything can stay connected from start to finish.</h2>
            <p class="lead">A clear nine-stage workflow makes it easier to understand what happens before construction, what happens on site and what must be completed before the owner moves in.</p>
        </div>

        <div class="site-wrap service-stage-list">
            <section class="service-stage" id="phase-01" data-service-stage>
                <div class="service-stage-heading">
                    <span class="service-stage-number">01</span>
                    <div>
                        <p class="eyebrow">Understand before building</p>
                        <h3>Pre-construction & project briefing</h3>
                        <p>We define what is being built, how the property needs to function and the site information needed before design decisions become expensive.</p>
                    </div>
                </div>
                <div class="service-stage-body">
                    <div class="service-work-list">
                        <h4>Scope can include</h4>
                        <ul>
                            <li>Client requirements and project brief</li>
                            <li>Site selection or suitability review, where needed</li>
                            <li>Site visit and existing-condition documentation</li>
                            <li>Measured, topographical and boundary survey coordination</li>
                            <li>Soil investigation / geotechnical coordination when required</li>
                            <li>Room, operational and storage requirements</li>
                            <li>Initial feasibility, priorities and project constraints</li>
                            <li>Early budget range and timeline discussion</li>
                        </ul>
                    </div>
                    <!-- PHOTO SLOT 02: Site survey, measuring, architect/ID team reviewing plans on location. -->
                    <figure class="service-photo-placeholder service-photo-wide">
                        <div class="service-photo-mark" aria-hidden="true">02</div>
                        <figcaption><strong>Recommended photo</strong><span>Site survey, measurement or planning session on the actual property.</span></figcaption>
                    </figure>
                </div>
            </section>

            <section class="service-stage" id="phase-02" data-service-stage>
                <div class="service-stage-heading">
                    <span class="service-stage-number">02</span>
                    <div>
                        <p class="eyebrow">Turn requirements into a buildable plan</p>
                        <h3>Design, budgeting & approvals coordination</h3>
                        <p>The architectural, interior, structural and building-services requirements are coordinated before work progresses on site.</p>
                    </div>
                </div>
                <div class="service-stage-body service-stage-body-single">
                    <div class="service-work-columns">
                        <div class="service-work-list">
                            <h4>Design development</h4>
                            <ul>
                                <li>Space planning and layout development</li>
                                <li>Architectural concept and interior direction</li>
                                <li>3D visualisation and material selection</li>
                                <li>Furniture, cabinet and storage planning</li>
                                <li>Structural and MEP coordination</li>
                            </ul>
                        </div>
                        <div class="service-work-list">
                            <h4>Project preparation</h4>
                            <ul>
                                <li>Detailed / working drawings</li>
                                <li>Estimate, BOQ and budget coordination</li>
                                <li>Project schedule and procurement planning</li>
                                <li>Authority submission / permit coordination where applicable</li>
                                <li>Consultant, contractor and specialist coordination</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section class="service-stage" id="phase-03" data-service-stage>
                <div class="service-stage-heading">
                    <span class="service-stage-number">03</span>
                    <div>
                        <p class="eyebrow">Build from the ground up</p>
                        <h3>Site preparation, earthwork & foundations</h3>
                        <p>Ground conditions, setting-out and foundation works are completed in the correct sequence before the main structure rises.</p>
                    </div>
                </div>
                <div class="service-stage-body">
                    <div class="service-work-list">
                        <h4>Typical works</h4>
                        <ul>
                            <li>Site clearing, mobilisation, layout and setting-out</li>
                            <li>Excavation and earthworks</li>
                            <li>PCC / blinding concrete where specified</li>
                            <li>Footing reinforcement, formwork and concrete</li>
                            <li>Column starters and pedestals</li>
                            <li>Plinth beam construction</li>
                            <li>Backfilling and compaction</li>
                            <li>DPC and anti-termite treatment where required</li>
                            <li>Ground-floor slab preparation and concreting</li>
                        </ul>
                    </div>
                    <!-- PHOTO SLOT 03: Foundation reinforcement, formwork or concrete works. -->
                    <figure class="service-photo-placeholder service-photo-wide">
                        <div class="service-photo-mark" aria-hidden="true">03</div>
                        <figcaption><strong>Recommended photo</strong><span>Foundation reinforcement, formwork or an active structural site.</span></figcaption>
                    </figure>
                </div>
            </section>

            <section class="service-stage" id="phase-04" data-service-stage>
                <div class="service-stage-heading">
                    <span class="service-stage-number">04</span>
                    <div>
                        <p class="eyebrow">Create the building shell</p>
                        <h3>Structure, walls, roof & building envelope</h3>
                        <p>The load-bearing structure and weather-protected shell are built, checked and prepared for the internal trades that follow.</p>
                    </div>
                </div>
                <div class="service-stage-body service-stage-body-single">
                    <div class="service-work-columns">
                        <div class="service-work-list">
                            <h4>Superstructure</h4>
                            <ul>
                                <li>RC or specified steel columns and beams</li>
                                <li>Slab reinforcement and concreting</li>
                                <li>Staircase construction</li>
                                <li>Brick / block masonry</li>
                                <li>Lintels, sunshades and structural details</li>
                                <li>Curing, de-shuttering and quality checks</li>
                            </ul>
                        </div>
                        <div class="service-work-list">
                            <h4>Envelope & protection</h4>
                            <ul>
                                <li>Roof and parapet works</li>
                                <li>Terrace, balcony and roof waterproofing</li>
                                <li>External plaster, cladding or facade finishes</li>
                                <li>External doors, windows and glazing</li>
                                <li>Sealants and weatherproofing details</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section class="service-stage" id="phase-05" data-service-stage>
                <div class="service-stage-heading">
                    <span class="service-stage-number">05</span>
                    <div>
                        <p class="eyebrow">Make the property work</p>
                        <h3>MEP & building systems</h3>
                        <p>Mechanical, electrical and plumbing systems are coordinated with the architectural and interior layouts before walls and ceilings are closed.</p>
                    </div>
                </div>
                <div class="service-stage-body service-stage-body-single">
                    <div class="service-work-columns service-work-columns-three">
                        <div class="service-work-list">
                            <h4>Plumbing</h4>
                            <ul>
                                <li>Water supply lines</li>
                                <li>Waste and drainage systems</li>
                                <li>Sanitary and kitchen points</li>
                                <li>Water tank / pump coordination</li>
                                <li>Pressure and leak testing</li>
                            </ul>
                        </div>
                        <div class="service-work-list">
                            <h4>Electrical</h4>
                            <ul>
                                <li>Conduits, wiring and distribution boards</li>
                                <li>Lighting, switches and socket points</li>
                                <li>Earthing and lightning protection where required</li>
                                <li>Data, CCTV, access control and intercom if included</li>
                                <li>Appliance and equipment power points</li>
                            </ul>
                        </div>
                        <div class="service-work-list">
                            <h4>Mechanical & safety</h4>
                            <ul>
                                <li>Air-conditioning and ventilation coordination</li>
                                <li>Exhaust systems</li>
                                <li>Fire protection systems where applicable</li>
                                <li>Service access and maintenance planning</li>
                                <li>Testing before concealment</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section class="service-stage" id="phase-06" data-service-stage>
                <div class="service-stage-heading">
                    <span class="service-stage-number">06</span>
                    <div>
                        <p class="eyebrow">Turn the shell into finished rooms</p>
                        <h3>Interior construction & finishing works</h3>
                        <p>Surfaces, ceilings, bathrooms, doors and decorative elements are completed to create the final interior environment.</p>
                    </div>
                </div>
                <div class="service-stage-body">
                    <div class="service-work-list">
                        <h4>Interior finishing can include</h4>
                        <ul>
                            <li>Internal plastering, levelling and skim coat</li>
                            <li>Wet-area waterproofing</li>
                            <li>Floor screed and floor preparation</li>
                            <li>Tiles, marble, granite, vinyl, timber or other flooring</li>
                            <li>False ceiling, bulkheads and ceiling details</li>
                            <li>Painting and decorative wall finishes</li>
                            <li>Internal doors, glass and railing works</li>
                            <li>Sanitary fixtures, taps, mixers and bathroom accessories</li>
                            <li>Final lighting fixtures and feature lighting</li>
                        </ul>
                    </div>
                    <!-- PHOTO SLOT 04: Interior fit-out in progress or a strong finished interior detail. -->
                    <figure class="service-photo-placeholder service-photo-wide">
                        <div class="service-photo-mark" aria-hidden="true">04</div>
                        <figcaption><strong>Recommended photo</strong><span>Interior fit-out, ceiling/lighting work, tiling or a polished finished-room detail.</span></figcaption>
                    </figure>
                </div>
            </section>

            <section class="service-stage" id="phase-07" data-service-stage>
                <div class="service-stage-heading">
                    <span class="service-stage-number">07</span>
                    <div>
                        <p class="eyebrow">Make every room usable</p>
                        <h3>Custom cabinetry, furniture & final fit-out</h3>
                        <p>This is where IdeaRE’s furniture and cabinet work becomes part of the full project rather than a separate afterthought.</p>
                    </div>
                </div>
                <div class="service-stage-body">
                    <div class="service-work-list">
                        <h4>Built-ins & furniture</h4>
                        <ul>
                            <li>Wet and dry kitchen cabinetry</li>
                            <li>Wardrobes and dressing storage</li>
                            <li>Vanities, shoe cabinets and utility storage</li>
                            <li>TV consoles, display units and feature joinery</li>
                            <li>Office, study and commercial built-ins where required</li>
                            <li>HPL, laminate, veneer, paint and other finishes</li>
                            <li>Quartz, sintered stone and other worktop / backsplash options</li>
                            <li>Hardware, soft-close systems and internal accessories</li>
                            <li>Loose furniture such as sofas, beds, dining and study furniture if included</li>
                            <li>Curtains, blinds, mirrors and selected styling elements</li>
                            <li>Appliance integration and final fitment coordination</li>
                        </ul>
                    </div>
                    <!-- PHOTO SLOT 05: Finished kitchen/cabinetry or a furnished room. -->
                    <figure class="service-photo-placeholder service-photo-wide">
                        <div class="service-photo-mark" aria-hidden="true">05</div>
                        <figcaption><strong>Recommended photo</strong><span>A finished kitchen, wardrobe wall or fully furnished room showing IdeaRE cabinetry.</span></figcaption>
                    </figure>
                </div>
            </section>

            <section class="service-stage" id="phase-08" data-service-stage>
                <div class="service-stage-heading">
                    <span class="service-stage-number">08</span>
                    <div>
                        <p class="eyebrow">Finish the property beyond the walls</p>
                        <h3>External works & site completion</h3>
                        <p>The surrounding site is completed so the property functions as a whole, not just as a finished interior.</p>
                    </div>
                </div>
                <div class="service-stage-body service-stage-body-single">
                    <div class="service-work-columns">
                        <div class="service-work-list">
                            <h4>External construction</h4>
                            <ul>
                                <li>Compound wall, gate and entrance works</li>
                                <li>Paving, driveway and hardscape</li>
                                <li>External drainage and storm-water coordination</li>
                                <li>Water tanks, sewer or septic connection where applicable</li>
                                <li>External lighting and service points</li>
                            </ul>
                        </div>
                        <div class="service-work-list">
                            <h4>Site finish</h4>
                            <ul>
                                <li>Landscape and planting works</li>
                                <li>Porch, patio, deck or pergola works where included</li>
                                <li>Site grading and final surface correction</li>
                                <li>Exterior touch-up and final presentation</li>
                                <li>Removal of remaining temporary works and debris</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section class="service-stage service-stage-final" id="phase-09" data-service-stage>
                <div class="service-stage-heading">
                    <span class="service-stage-number">09</span>
                    <div>
                        <p class="eyebrow">Ready for the owner</p>
                        <h3>Testing, snagging, handover & move-in readiness</h3>
                        <p>The project is checked as a complete property before the owner takes possession and begins using the space.</p>
                    </div>
                </div>
                <div class="service-stage-body">
                    <div class="service-work-list">
                        <h4>Before handover</h4>
                        <ul>
                            <li>Quality inspection and testing</li>
                            <li>Electrical, plumbing and system commissioning</li>
                            <li>Snag list preparation and rectification</li>
                            <li>Final fixtures, fittings and furniture placement</li>
                            <li>Appliance checks where included in scope</li>
                            <li>Deep cleaning and final presentation</li>
                            <li>Client walkthrough and operating guidance</li>
                            <li>Handover documentation, warranties and maintenance information</li>
                            <li>Keys and final possession handover</li>
                            <li>Defects-liability / after-sales support according to the project agreement</li>
                        </ul>
                    </div>
                    <!-- PHOTO SLOT 06: Owner handover, final completed exterior or fully styled interior. -->
                    <figure class="service-photo-placeholder service-photo-wide service-photo-complete">
                        <div class="service-photo-mark" aria-hidden="true">06</div>
                        <figcaption><strong>Final handover photo</strong><span>Use a completed project, key handover or fully styled interior ready for the owner.</span></figcaption>
                    </figure>
                </div>
            </section>
        </div>
    </section>

    <section class="section move-in-section" aria-labelledby="move-in-title">
        <div class="site-wrap move-in-grid">
            <div class="move-in-copy">
                <p class="eyebrow">What “ready to occupy” means</p>
                <h2 id="move-in-title">The owner should not receive an unfinished shell.</h2>
                <p class="lead">When these items are part of the agreed project scope, IdeaRE can carry them through to the end so the space is practical, furnished and ready for daily use.</p>
                <div class="actions">
                    <a class="btn primary" href="<?= $customerRoot ?>pages/book-appointment.php">Start a project discussion</a>
                    <a class="btn" href="<?= $customerRoot ?>index.php#portfolio">See our work</a>
                </div>
            </div>
            <div class="move-in-checklist" role="list">
                <div role="listitem"><span>✓</span><p><strong>Working building services</strong><small>Lighting, switches, sockets, water, drainage, ventilation and relevant systems tested.</small></p></div>
                <div role="listitem"><span>✓</span><p><strong>Finished rooms</strong><small>Floors, walls, ceilings, bathrooms, doors, glazing and final touch-ups completed.</small></p></div>
                <div role="listitem"><span>✓</span><p><strong>Cabinetry installed</strong><small>Kitchen, wardrobes, vanities, storage and selected custom joinery fitted and checked.</small></p></div>
                <div role="listitem"><span>✓</span><p><strong>Furniture positioned</strong><small>Loose furniture, curtains, selected appliances and styling elements placed where included.</small></p></div>
                <div role="listitem"><span>✓</span><p><strong>Snags rectified</strong><small>Final inspection items resolved before the formal walkthrough and handover.</small></p></div>
                <div role="listitem"><span>✓</span><p><strong>Clean and handover-ready</strong><small>Final cleaning, documentation, warranties and owner handover completed.</small></p></div>
            </div>
        </div>
    </section>

    <section class="services-cta-section">
        <div class="site-wrap services-cta-card">
            <div>
                <p class="eyebrow">Have a site, an empty unit or an unfinished property?</p>
                <h2>Bring IdeaRE in from the beginning — or let us take over from your current stage.</h2>
            </div>
            <div class="services-cta-actions">
                <a class="btn primary" href="<?= $customerRoot ?>pages/book-appointment.php">Book a consultation</a>
                <a class="btn" href="<?= $customerRoot ?>index.php#contact">Send an enquiry</a>
                <a class="services-top-link" href="#services-top">Back to top ↑</a>
            </div>
        </div>
    </section>
</main>

<?php require __DIR__ . '/../../includes/customer/footer.php'; ?>
