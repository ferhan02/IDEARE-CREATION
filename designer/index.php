<?php
$pageTitle='IDEARE | 3D Space & Cabinet Designer';
$pageStyles=['assets/css/designer-3d.css','assets/css/designer-3d-compact-theme.css'];
require __DIR__.'/../includes/customer/header.php';
?>
<main class="id3-app" id="id3-app">
  <div class="id3-topline">
    <div><p class="id3-kicker">IDEARE · INTERACTIVE PLANNER</p><h1>Design your space</h1><p class="id3-subtitle">Explore your ideas in 3D. Final measurements and construction are verified by IDEARE.</p></div>
    <div class="id3-top-actions"><button class="id3-btn id3-secondary" id="undo" disabled title="Undo">↶ Undo</button><button class="id3-btn id3-secondary" id="redo" disabled title="Redo">↷ Redo</button><span id="autosave-status" aria-live="polite">Draft ready</span></div>
  </div>
  <nav class="id3-steps" aria-label="Designer stages">
    <button data-step="1" class="current"><span>01</span> Room shape</button>
    <button data-step="2"><span>02</span> Define space</button>
    <button data-step="3"><span>03</span> Make it yours</button>
    <button data-step="4"><span>04</span> Finalize</button>
  </nav>
  <div id="designer-message" class="id3-message" role="status" hidden></div>
  <section class="id3-section" data-panel="1">
    <div class="id3-intro"><h2>Start with your room shape</h2><p>Choose the closest floor plan. You can edit all dimensions next.</p></div>
    <div class="id3-shapes" id="shape-grid">
      <button type="button" data-shape="rectangle" class="selected"><svg viewBox="0 0 110 80"><path d="M16 12H94V68H16Z"/></svg><strong>Rectangular</strong><small>Enclosed room</small></button>
      <button type="button" data-shape="notch"><svg viewBox="0 0 110 80"><path d="M16 12H72V28H94V68H16Z"/></svg><strong>Notched</strong><small>Irregular room</small></button>
      <button type="button" data-shape="angled"><svg viewBox="0 0 110 80"><path d="M16 12H69L94 35V68H16Z"/></svg><strong>Angled</strong><small>Cut corner</small></button>
      <button type="button" data-shape="open"><svg viewBox="0 0 110 80"><path d="M16 12H94V68H16Z"/><path class="dotted" d="M16 40H94"/></svg><strong>Open plan</strong><small>Open wall edge</small></button>
      <button type="button" data-shape="l_open"><svg viewBox="0 0 110 80"><path d="M16 12H94V40H56V68H16Z"/></svg><strong>L-shaped</strong><small>Open-plan space</small></button>
      <button type="button" data-shape="u_open"><svg viewBox="0 0 110 80"><path d="M16 12H94V68H16Z"/><path class="dotted" d="M94 12V68"/></svg><strong>U-style open</strong><small>One side open</small></button>
    </div>
    <div class="id3-step-footer"><span>Measurements are illustrative until verified on site.</span><button class="id3-btn id3-primary" data-next="2">Continue to measurements →</button></div>
  </section>
  <section class="id3-section" data-panel="2" hidden>
    <div class="id3-intro"><h2>Define your room</h2><p>All dimensions are in millimetres. Customize the walls and add indicative doors, windows or services.</p></div>
    <div class="id3-room-layout">
      <aside class="id3-card id3-room-settings">
        <h3>Room dimensions</h3>
        <label>Width (mm)<input id="room-width" type="number" value="4000" min="1200" max="20000" step="1"></label>
        <label>Length (mm)<input id="room-depth" type="number" value="4000" min="1200" max="20000" step="1"></label>
        <label>Ceiling height (mm)<input id="room-height" type="number" value="2700" min="1800" max="8000" step="1"></label>
        <label>Room type<select id="room-kind"><option>Wet kitchen</option><option>Dry kitchen</option><option>Kitchen</option><option>Wardrobe</option><option>Living room</option><option>Other</option></select></label>
        <div class="id3-separator"></div>
        <h3>Openings &amp; services</h3>
        <div class="id3-button-grid"><button data-feature="door" type="button">+ Door</button><button data-feature="window" type="button">+ Window</button><button data-feature="outlet" type="button">+ Outlet</button><button data-feature="plumbing" type="button">+ Plumbing</button></div>
        <div id="feature-list" class="id3-feature-list"></div>
        <p class="id3-note">Opening symbols indicate positions only. Wall cut-outs, structural requirements, and services need site verification.</p>
      </aside>
      <div class="id3-card id3-plan-panel"><div class="id3-pane-head"><strong>Room preview</strong><span id="room-area">16.00 m²</span></div><div id="plan-svg" class="id3-floor-svg" aria-label="Room floor plan preview"></div></div>
    </div>
    <div class="id3-step-footer"><button class="id3-btn id3-secondary" data-next="1">← Room shape</button><button class="id3-btn id3-primary" data-next="3">Continue to 3D designer →</button></div>
  </section>
  <section class="id3-section id3-design-section" data-panel="3" hidden>
    <div class="id3-catalog" id="catalog-bar">
      <button data-menu="1" aria-expanded="false">▥ Cabinets <span>⌄</span></button>
      <button data-menu="2" aria-expanded="false">▤ Appliances <span>⌄</span></button>
      <button data-menu="3" aria-expanded="false">▣ Dining <span>⌄</span></button>
      <button data-menu="4" aria-expanded="false">✧ Accessories <span>⌄</span></button>
      <button data-menu="5" aria-expanded="false">◈ Materials <span>⌄</span></button>
      <div class="id3-megamenu" id="catalog-menu" hidden></div>
    </div>
    <div class="id3-design-grid">
      <section class="id3-viewport-col">
        <div class="id3-viewport-toolbar"><div><strong>3D room preview</strong><span id="object-count">0 cabinets</span></div><div class="id3-viewport-modes"><button data-camera="orbit" class="active" type="button">3D Orbit</button><button data-camera="plan" type="button">Floor plan</button><button data-camera="walk" type="button">Walkthrough</button></div></div>
        <div class="id3-canvas-wrap" id="canvas-wrap"><canvas id="designer-canvas" aria-label="Interactive 3D cabinet design"></canvas><div class="id3-canvas-hint">Click a cabinet to modify · Drag to move · Scroll to zoom</div><div id="canvas-loader">Initializing 3D viewer…</div></div>
        <div class="id3-canvas-footer"><span id="room-badge">4000 × 4000 mm</span><span id="selection-badge">No cabinet selected</span><button id="recenter" class="id3-tiny" type="button">⌗ Fit room</button></div>
        <div class="id3-list-header"><strong>Cabinets in design</strong><button id="clear-scene" class="id3-tiny" type="button">Clear cabinets</button></div>
        <div id="cabinet-list" class="id3-cabinet-list"><p class="id3-muted">Add your first cabinet from the Cabinets menu.</p></div>
      </section>
      <aside class="id3-inspector" id="inspector">
        <div class="id3-inspector-empty" id="empty-inspector"><div class="id3-empty-icon">▥</div><h3>Select a cabinet</h3><p>Click a cabinet in the 3D room or select one from the list to adjust its dimensions, interior, doors, materials and accessories.</p></div>
        <div id="selected-inspector" hidden>
          <div class="id3-edit-mode"><span>Editing tools</span><button type="button" data-edit-mode="simple">Quick</button><button type="button" data-edit-mode="advanced" class="active">Advanced</button></div>
          <div class="id3-inspector-title"><div><p class="id3-kicker">SELECTED CABINET</p><h3 id="selected-name">Cabinet</h3><small id="selected-size">—</small></div><button id="deselect" class="id3-close" type="button" aria-label="Close inspector">×</button></div>
          <div class="id3-object-actions"><button id="open-doors" type="button">◫ Open</button><button id="duplicate" type="button">▣ Duplicate</button><button id="rotate" type="button">↻ Rotate</button><button id="remove" type="button">⌫ Remove</button></div>
          <div id="cabinet-notices" aria-live="polite"></div>
          <div class="id3-accordion" id="inspector-tabs">
            <details open><summary>Dimensions &amp; position</summary><div class="id3-detail"><div id="dimension-fields"></div><div class="id3-small-fields"><label>X position (mm)<input data-property="x" type="number" step="10"></label><label>Z position (mm)<input data-property="z" type="number" step="10"></label></div><p class="id3-note">Slider ranges show suggested dimensions. Exact typed values are allowed outside these ranges and flagged for review.</p></div></details>
            <details><summary>Doors &amp; drawer fronts</summary><div class="id3-detail"><label>Front configuration<select data-property="front"><option value="doors">Swing doors</option><option value="drawers">Drawer fronts</option><option value="open">Open shelving</option></select></label><label>Number of doors<select data-property="doorCount"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></label><label>Door opening<select data-property="opening"><option value="swing">Hinged swing</option><option value="lift">Lift-up (review)</option><option value="sliding">Sliding (review)</option></select></label><label>Single-door hinge side<select data-property="hingeSide"><option value="left">Left hinged</option><option value="right">Right hinged</option></select></label><label>Door style<select data-property="doorStyle"></select></label><label>Handle<select data-property="handle"></select></label></div></details>
            <details><summary>Internal layout</summary><div class="id3-detail"><label>Compartment dividers (vertical)<input data-property="partitions" type="number" min="0" max="4" step="1"></label><label>Number of shelves<input data-property="shelves" type="number" min="0" max="8" step="1"></label><div id="shelf-editor"></div><label>Drawer count<input data-property="drawers" type="number" min="0" max="6" step="1"></label><label>Drawer layout<select data-property="drawerLayout"><option value="equal">Equal heights</option><option value="shallow-top">Shallow top + deep lower</option><option value="custom">Custom ratios</option></select></label><div id="drawer-editor"></div></div></details>
            <details><summary>Materials &amp; finishing</summary><div class="id3-detail"><label>Carcass<select data-property="carcass"><option value="plywood">Plywood (confirm grade)</option><option value="melamine">Melamine-faced board</option><option value="blockboard">Blockboard</option></select></label><label>Front finish source<select id="material-source"><option value="standard">Standard colours</option><option value="topmix">Topmix HPL</option><option value="dgtango">DGTango HPL</option></select></label><div id="standard-colours"><label>Colour<select data-property="color"><option value="#e8e4dc">Warm white</option><option value="#907053">Walnut</option><option value="#b29a7a">Natural oak</option><option value="#86898a">Ash grey</option><option value="#333338">Charcoal</option></select></label></div><div id="hpl-picker" hidden><label>Search catalogue<input id="hpl-search" placeholder="Product name or code" autocomplete="off"></label><div id="hpl-results" class="id3-material-results"></div></div><label>Panel thickness (mm)<input data-property="thickness" type="number" min="12" max="36" step="1"></label></div></details>
            <details><summary>Hardware &amp; accessories</summary><div class="id3-detail"><label class="id3-check"><input data-property="softClose" type="checkbox"> Soft-close hardware</label><label class="id3-check"><input data-property="pushOpen" type="checkbox"> Push-to-open option (review)</label><label class="id3-check"><input data-property="led" type="checkbox"> Interior LED lighting</label><label class="id3-check"><input data-property="basket" type="checkbox"> Pull-out organizer / basket (review)</label><p class="id3-note">Exact hinge, runner and accessory models must be selected and verified by staff.</p></div></details>
            <details><summary>Worktop, plinth &amp; backsplash</summary><div class="id3-detail"><label class="id3-check"><input data-property="worktop" type="checkbox"> Add worktop to cabinet</label><label>Worktop finish<select data-property="worktopType"><option value="sintered">Sintered stone (provisional)</option><option value="quartz">Quartz (provisional)</option><option value="laminate">Laminate</option></select></label><label class="id3-check"><input data-property="plinth" type="checkbox"> Add legs / recessed plinth</label><label>Plinth height (mm)<input data-property="plinthHeight" type="number" min="50" max="200"></label><label class="id3-check"><input data-property="backsplash" type="checkbox"> Add backsplash (concept)</label><p class="id3-note">For a continuous worktop, plinth, or backsplash spanning multiple cabinets, staff will verify the full run.</p></div></details>
          </div>
        </div>
      </aside>
    </div>
    <div class="id3-step-footer"><button class="id3-btn id3-secondary" data-next="2">← Edit room</button><button class="id3-btn id3-primary" data-next="4">Proceed to finalize →</button></div>
  </section>
  <section class="id3-section" data-panel="4" hidden>
    <div class="id3-intro"><h2>Review and share your design</h2><p>Save your editable 3D design, download a concept PDF, or send it to IDEARE for staff consultation.</p></div>
    <div class="id3-final-grid">
      <div class="id3-card"><h3>Design overview</h3><div id="final-summary"></div><div id="final-findings"></div><p class="id3-note">Concept proposal only — not a final quotation, site survey, installation plan or production drawing.</p><div class="id3-final-buttons"><button id="download-pdf" class="id3-btn id3-secondary" type="button">↓ Download concept PDF</button><button class="id3-btn id3-secondary" data-next="3">← Keep designing</button></div></div>
      <form class="id3-card" id="customer-form" novalidate><h3>Save or discuss with IDEARE</h3><p class="id3-muted">Contact details are required to save or submit the editable design; no customer account is required.</p><label>Design name *<input name="design_name" required maxlength="150" placeholder="My dream kitchen"></label><div class="id3-small-fields"><label>Full name *<input name="customer_name" required maxlength="150" autocomplete="name"></label><label>WhatsApp / phone *<input name="customer_phone" required maxlength="50" autocomplete="tel"></label></div><label>Email address *<input name="customer_email" type="email" required maxlength="180" autocomplete="email"></label><div class="id3-small-fields"><label>Property type<select name="property_type"><option>Residential</option><option>Commercial</option><option>Other</option></select></label><label>Budget range<select name="budget_range"><option value="">Not specified</option><option>Below RM 10,000</option><option>RM 10,000–20,000</option><option>RM 20,000–40,000</option><option>RM 40,000–70,000</option><option>Above RM 70,000</option></select></label></div><label>Project location<input name="project_location" maxlength="255" placeholder="e.g. Seremban, Negeri Sembilan"></label><label>Preferred contact method<select name="preferred_contact_method"><option value="whatsapp">WhatsApp</option><option value="phone">Phone call</option><option value="email">Email</option></select></label><label>Project notes<textarea name="notes" rows="3" placeholder="Anything our staff should know?"></textarea></label><label class="id3-check"><input type="checkbox" name="consent" required> I agree to IDEARE contacting me about this design. *</label><div class="id3-final-buttons"><button id="save-design" class="id3-btn id3-secondary" type="button">Save editable design</button><button id="submit-design" class="id3-btn id3-primary" type="button">Submit to IDEARE →</button></div><div id="save-result" class="id3-save-result" role="status"></div></form>
    </div>
  </section>
</main>
<script>window.IDEARE_DESIGNER3D={api:'../api/designer3d/',root:'../'};</script>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/"}}</script>
<script type="module" src="../assets/js/designer-3d.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js" defer></script>
<?php require __DIR__.'/../includes/customer/footer.php'; ?>
