<?php $pageTitle='IDEARE | Cabinet Designer'; require __DIR__.'/../includes/customer/header.php'; ?>
<main class="designer-page">
<section class="designer-heading site-wrap"><div><p class="eyebrow">Interactive prototype</p><h1>IDEARE Cabinet Designer</h1><p>Choose a cabinet, customize it, add it to a layout, then save or print the design.</p></div><span class="mode-badge" id="modeBadge">Loading…</span></section>
<div class="designer-shell site-wrap">
<aside class="designer-controls">
<section class="panel"><h2>1. Cabinet</h2><label>Cabinet type<select id="template"></select></label><div class="three"><label>Width (mm)<input id="width" type="number"></label><label>Height (mm)<input id="height" type="number"></label><label>Depth (mm)<input id="depth" type="number"></label></div><small id="limits"></small></section>
<section class="panel"><h2>2. Appearance</h2><label>Finish<select id="finish"></select></label><label>Colour<select id="color"></select></label><label>Door style<select id="door"></select></label><label>Handle<select id="handle"></select></label></section>
<section class="panel"><h2>3. Extras</h2><label>Shelves<select id="shelves"><option>0</option><option selected>1</option><option>2</option><option>3</option><option>4</option></select></label><label class="check"><input id="soft" type="checkbox" checked> Soft-close hardware</label><button id="addBtn" class="btn primary wide">Add cabinet</button></section>
</aside>
<section class="designer-main">
<section class="panel"><div class="rowtop"><div><p class="eyebrow">Live preview</p><h2 id="previewName">Cabinet</h2></div><strong id="previewPrice" class="price">RM 0</strong></div><div class="preview-stage"><span id="wLabel" class="mw">600 mm</span><span id="hLabel" class="mh">850 mm</span><div id="preview" class="cabinet-preview"></div></div><div id="meta" class="chips"></div></section>
<section class="panel"><div class="rowtop"><div><p class="eyebrow">Current design</p><h2>Cabinet arrangement</h2></div><button id="clearBtn" class="btn">Clear</button></div><div id="empty" class="empty-layout">Add your first cabinet to start the layout.</div><div id="layout" class="cabinet-row"></div><div class="design-totals"><div><span>Total width</span><strong id="totalWidth">0 mm</strong></div><div><span>Cabinets</span><strong id="totalCount">0</strong></div><div><span>Estimated total</span><strong id="totalPrice">RM 0</strong></div></div></section>
<section class="panel"><div class="rowtop"><div><p class="eyebrow">Save / present</p><h2>Design details</h2></div><span id="code" class="mode-badge">Not saved</span></div><div class="two"><label>Design name<input id="designName" value="Boss Demo Kitchen"></label><label>Customer name<input id="customerName"></label><label>Customer email<input id="customerEmail" type="email"></label><label>Phone<input id="phone"></label><label>Room<select id="room"><option>Kitchen</option><option>Wardrobe</option><option>TV Cabinet</option><option>Vanity</option><option>Storage</option></select></label></div><label>Notes<textarea id="notes" rows="3"></textarea></label><div class="actions"><button id="saveBtn" class="btn primary">Save design</button><button id="printBtn" class="btn">Print / Save as PDF</button></div><p id="status" class="muted"></p></section>
</section>
</div>
</main>
<script src="../assets/js/designer.js"></script>
<?php require __DIR__.'/../includes/customer/footer.php'; ?>
