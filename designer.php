<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>IDEARE Cabinet Designer</title>
<link rel="stylesheet" href="assets/css/style.css">
<link rel="stylesheet" href="assets/css/ui-polish.css">
</head>
<body>
<header class="topbar">
  <div class="wrap nav">
    <a href="index.php" class="brand logo-link" aria-label="IDEARE home">
      <img class="brand-logo-image legacy-brand-logo" src="assets/images/ideare-logo.png" alt="IDEARE">
    </a>
    <a href="designer.php">Cabinet Designer</a>
  </div>
</header>

<main class="wrap designer">
<section class="designer-title">
<div><p class="eyebrow">Interactive prototype</p><h1>IDEARE Cabinet Designer</h1><p>Build a quick cabinet arrangement for the customer.</p></div>
<span id="modeBadge" class="badge">Loading…</span>
</section>

<div class="designer-grid">
<aside class="controls">
<section class="panel">
<h2>1. Cabinet</h2>
<label>Cabinet type<select id="template"></select></label>
<div class="three">
<label>Width (mm)<input id="width" type="number"></label>
<label>Height (mm)<input id="height" type="number"></label>
<label>Depth (mm)<input id="depth" type="number"></label>
</div>
<small id="limits"></small>
</section>

<section class="panel">
<h2>2. Appearance</h2>
<label>Finish<select id="finish"></select></label>
<label>Colour<select id="color"></select></label>
<label>Door style<select id="door"></select></label>
<label>Handle<select id="handle"></select></label>
</section>

<section class="panel">
<h2>3. Extras</h2>
<label>Shelves<select id="shelves"><option>0</option><option selected>1</option><option>2</option><option>3</option><option>4</option></select></label>
<label class="check"><input id="soft" type="checkbox" checked> Soft-close hardware</label>
<button id="addBtn" class="btn primary wide">Add cabinet</button>
</section>
</aside>

<section class="workspace">
<div class="panel">
<div class="rowtop"><div><p class="eyebrow">Live preview</p><h2 id="previewName">Cabinet</h2></div><strong id="previewPrice" class="price">RM 0</strong></div>
<div class="stage">
<span id="wLabel" class="mw">600 mm</span>
<span id="hLabel" class="mh">850 mm</span>
<div id="preview" class="cabinet"></div>
</div>
<div id="meta" class="chips"></div>
</div>

<div class="panel">
<div class="rowtop"><div><p class="eyebrow">Current design</p><h2>Cabinet arrangement</h2></div><button id="clearBtn" class="btn">Clear</button></div>
<div id="empty" class="empty">Add your first cabinet to start the layout.</div>
<div id="layout" class="layout"></div>
<div class="totals">
<div><small>Total width</small><strong id="totalWidth">0 mm</strong></div>
<div><small>Cabinets</small><strong id="totalCount">0</strong></div>
<div><small>Estimated total</small><strong id="totalPrice">RM 0</strong></div>
</div>
</div>

<div class="panel">
<div class="rowtop"><div><p class="eyebrow">Save / present</p><h2>Design details</h2></div><span id="code" class="badge">Not saved</span></div>
<div class="two">
<label>Design name<input id="designName" value="Boss Demo Kitchen"></label>
<label>Customer name<input id="customerName" placeholder="Optional"></label>
<label>Phone<input id="phone" placeholder="Optional"></label>
<label>Room<select id="room"><option>Kitchen</option><option>Wardrobe</option><option>TV Cabinet</option><option>Vanity</option></select></label>
</div>
<label>Notes<textarea id="notes" rows="3" placeholder="Notes for the negotiator..."></textarea></label>
<div class="actions"><button id="saveBtn" class="btn primary">Save design</button><button id="printBtn" class="btn">Print / Save as PDF</button></div>
<p id="status" class="status"></p>
</div>
</section>
</div>
</main>
<script src="assets/js/designer.js"></script>
</body></html>
