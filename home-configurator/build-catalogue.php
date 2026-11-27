<section class="hc-catalog" aria-label="Build catalogue">
  <div class="hc-catalog-house">
    <div class="hc-catalog-heading"><span class="hc-kicker">Build mode</span><span>Pick a part of the house</span></div>
    <svg class="hc-house-map" viewBox="0 0 290 145" aria-label="Interactive architectural house categories" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="hc-roof" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#b5a28c"/><stop offset="1" stop-color="#746250"/></linearGradient>
        <filter id="hc-house-hover" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feFlood flood-color="var(--hc-house-highlight)" flood-opacity=".42"/><feComposite in2="SourceAlpha" operator="in" result="tint"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="tint"/></feMerge></filter>
        <filter id="hc-house-selected" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feFlood flood-color="var(--hc-house-highlight)" flood-opacity=".78"/><feComposite in2="SourceAlpha" operator="in" result="tint"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="tint"/></feMerge></filter>
      </defs>
      <path d="M8 104 117 47 280 103 165 142Z" fill="var(--hc-ground,#b8b9a0)" opacity=".65" stroke="none"/>
      <g data-hc-category="foundation" role="button" tabindex="0" aria-label="Foundations and platforms"><title>Foundations and platforms</title><path d="M38 103 141 137 217 95 217 104 141 145 38 112Z" fill="#a59986"/><path d="M38 103 112 62 217 95 141 137Z" fill="#d2c5b3"/></g>
      <g data-hc-category="walls" role="button" tabindex="0" aria-label="Walls and rooms"><title>Walls and rooms</title><path d="M48 55 141 84 141 130 48 101Z" fill="#f1e6d5"/><path d="M141 84 207 48 207 95 141 130Z" fill="#c8b7a0"/><path d="M141 84 141 130" fill="none"/></g>
      <g data-hc-category="roof" role="button" tabindex="0" aria-label="Roofs"><title>Roofs</title><path d="M36 56 88 9 181 38 150 87Z" fill="url(#hc-roof)"/><path d="M88 9 155 1 218 45 181 38Z" fill="#cbbda9"/><path d="M150 87 181 38 218 45 207 52Z" fill="#8f7d69"/><path d="M48 48 141 78M59 38 151 68M70 28 161 58" fill="none" opacity=".55"/></g>
      <g data-hc-category="windows" role="button" tabindex="0" aria-label="Windows"><title>Windows</title><path d="M60 68 87 77 87 98 60 89Z" fill="#87a4a9" stroke="#f9f2e8" stroke-width="3"/><path d="M73.5 72.5V93.5M60 79 87 88" fill="none" stroke="#f9f2e8"/><path d="M164 79 194 63 194 83 164 100Z" fill="#87a4a9" stroke="#f9f2e8" stroke-width="3"/><path d="M179 71V91M164 89 194 73" stroke="#f9f2e8" fill="none"/></g>
      <g data-hc-category="paint" role="button" tabindex="0" aria-label="Wall paint"><title>Wall paint</title><path d="M145 103 160 95 160 119 145 127Z" fill="#b9a28d" stroke="#8f7458"/><path d="m149 108 7-4m-7 9 7-4m-7 9 7-4" stroke="#e8d9c8" fill="none"/></g>
      <g data-hc-category="doors" role="button" tabindex="0" aria-label="Doors"><title>Doors</title><path d="M103 86 127 94 127 123 103 115Z" fill="#947457" stroke="#f1e6d5" stroke-width="2.5"/><path d="M109 92 121 96 121 108 109 104Z" fill="#c6ae8d" stroke="none"/><circle cx="121" cy="111" r="1.8" fill="#e9d8af"/></g>
      <g data-hc-category="floors" role="button" tabindex="0" aria-label="Floors and tiles"><title>Floors and tiles</title><path d="M13 104 38 90 76 102 50 118Z" fill="#d0b18e"/><path d="M25 97 63 110M32 94 70 106M26 108 52 93M38 113 63 99" fill="none" stroke="#8f7458"/></g>
      <g data-hc-category="stairs" role="button" tabindex="0" aria-label="Stairs and storeys"><title>Stairs and storeys</title><path d="M102 116 130 125 141 119 141 125 130 131 102 122Z" fill="#aa9984"/><path d="M97 122 130 133 141 127 141 132 130 138 97 127Z" fill="#c8b69b"/><path d="M93 127 130 139 141 133 141 138 130 144 93 132Z" fill="#dfceb6"/></g>
      <g data-hc-category="outdoor" role="button" tabindex="0" aria-label="Outdoor paving, fences and extensions"><title>Outdoor and extensions</title><path d="M207 95 232 81 249 87 224 102Z" fill="#b49b79"/><path d="M210 93 235 86M218 98 242 90" fill="none"/><path d="M216 76 260 61 276 66" fill="none" stroke="#71634f" stroke-width="2"/><path d="M216 68V87M227 64V82M238 60V78M249 56V74M260 53V71M276 58V76" stroke="#8f7458" stroke-width="3"/></g>
      <g data-hc-category="pools" role="button" tabindex="0" aria-label="Swimming pools"><title>Swimming pools</title><path d="M181 122 228 96 279 112 231 139Z" fill="#e1d7c7"/><path d="M190 122 228 101 269 113 231 134Z" fill="#79afbd"/><path d="M208 121 232 108M223 127 248 113" fill="none" stroke="#c6e0e1"/></g>
    </svg>
    <div id="hc-house-caption" class="hc-house-caption" aria-live="polite">Walls & rooms</div>
  </div>
  <div class="hc-catalog-main">
    <div class="hc-catalog-top"><div id="hc-category-tabs" class="hc-category-tabs" aria-label="Build categories"></div><label class="hc-search"><span class="hc-search-icon" aria-hidden="true">⌕</span><input id="hc-catalog-search" type="search" placeholder="Find a build item" aria-label="Search build catalogue" autocomplete="off"></label></div>
    <div class="hc-catalog-meta"><strong id="hc-category-title">Walls &amp; rooms</strong><span id="hc-catalog-help">Choose a tool, then drag on the 3D grid.</span></div>
    <div id="hc-catalog-items" class="hc-catalog-items" aria-label="Available building tools"></div>
  </div>
</section>
