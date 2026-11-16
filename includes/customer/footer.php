<?php
$customerRoot = $customerRoot ?? '';
$pageScripts = $pageScripts ?? [];
?>
<footer class="site-footer">
  <div class="site-wrap footer-wrap location-footer-wrap">
    <span class="location-footer-copy">&copy; <?= date('Y') ?> IDEARE</span>
    <a class="footer-location-link" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>pages/where-we-are.php" aria-label="Find our location on Google Maps">
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/></svg>
      <span>Find Our Location</span>
      <svg class="footer-location-arrow" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
    </a>
    <span class="location-footer-copy">Architecture &amp; Interior Design</span>
  </div>
</footer>
<!-- Shared palette loaded last for every customer page and the 3D Designer. -->
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/ideare-unified-theme.css?v=20261116">
<script src="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/theme-icons.js"></script>
<script src="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/site.js"></script>
<?php foreach ($pageScripts as $script): ?>
<script src="<?= htmlspecialchars($customerRoot . ltrim($script, '/'), ENT_QUOTES, 'UTF-8') ?>"></script>
<?php endforeach; ?>
<?php if (($idearePage ?? '') === 'home'): ?>
<!-- Shared circular 3D Cabinet Inspirations gallery; independent of staff-published records. -->
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/concept-orbit.css">
<!-- Compact five-stage project journey, separate from the Services disciplines. -->
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/home-project-journey.css">
<!-- Homepage-only section sizing and spacing, loaded last to respect device CSS. -->
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/homepage-compact.css">
<script src="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/concept-orbit.js"></script>
<script src="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/home-project-journey.js"></script>
<script src="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/portfolio-showcase.js"></script>
<!-- Homepage wheel navigation is inline so browser cache and missing asset paths cannot disable it. -->
<script>
(() => {
  'use strict';
  if (window.__ideareSectionWheelReady) return;
  window.__ideareSectionWheelReady = true;
  const desktop = () => innerWidth >= 900;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const exclusions = '.ci-orbit-frame,.ci-orbit-area,[role="dialog"],dialog,.portfolio-modal,.portfolio-image-viewer,input,textarea,select,[contenteditable],[data-scroll-native],.modal';
  const header = () => document.querySelector('.site-header')?.getBoundingClientRect().height || 70;
  const maxY = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const topY = el => el.getBoundingClientRect().top + window.scrollY;
  let gesture = false, lastInput = 0, release = 0, active = false, raf = 0, destination = null, token = 0;
  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
  function stops() {
    const main = document.querySelector('main');
    if (!main) return [];
    const sections = [...main.children].filter(el => el.tagName === 'SECTION' && el.getClientRects().length && getComputedStyle(el).display !== 'none');
    const lim = maxY(), h = header(), usable = Math.max(300, innerHeight-h);
    const pos = [0];
    for (const section of sections) {
      const start = clamp(topY(section)-h, 0, lim);
      const end = clamp(topY(section)+section.getBoundingClientRect().height-innerHeight, start, lim);
      pos.push(start);
      const segments = Math.ceil((end-start)/(usable*.85));
      for (let i=1;i<=segments;i++) pos.push(start+(end-start)*i/segments);
    }
    pos.push(lim);
    const sorted = pos.map(Math.round).sort((a,b)=>a-b);
    return sorted.filter((v,i)=>!i || v-sorted[i-1]>12);
  }
  function nativeArea(target, dir) {
    let el = target instanceof Element ? target : target?.parentElement;
    while (el && el !== document.body && el !== document.documentElement) {
      if (el.matches(exclusions)) return true;
      const st = getComputedStyle(el);
      if (/(auto|scroll)/.test(st.overflowY) && el.scrollHeight > el.clientHeight + 5) {
        if (dir > 0 && el.scrollTop+el.clientHeight < el.scrollHeight-3) return true;
        if (dir < 0 && el.scrollTop > 3) return true;
      }
      el = el.parentElement;
    }
    return false;
  }
  function cancel() { token++; cancelAnimationFrame(raf);active=false;destination=null; }
  function animate(to) {
    cancel();
    const from = window.scrollY, dist = to-from;
    if (Math.abs(dist)<3) return;
    if (reduce.matches) {window.scrollTo(0,to);return;}
    const id=++token, start=performance.now(), duration=clamp(590+Math.abs(dist)*.16,610,940);
    active=true;destination=to;
    const ease=t=>1-Math.pow(1-t,4);
    function tick(now) {
      if (id!==token) return;
      const t=clamp((now-start)/duration,0,1);
      window.scrollTo({top:from+dist*ease(t),behavior:'instant'});
      if (t<1) raf=requestAnimationFrame(tick);
      else {window.scrollTo({top:to,behavior:'instant'});active=false;destination=null;}
    }
    raf=requestAnimationFrame(tick);
  }
  window.addEventListener('wheel', event => {
    if (!desktop() || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented) return;
    if (Math.abs(event.deltaX)>Math.abs(event.deltaY)*1.25 || !event.deltaY) return;
    if (document.body.style.overflow === 'hidden' || document.querySelector('dialog[open],.portfolio-modal[aria-hidden="false"]')) return;
    const dir=Math.sign(event.deltaY);
    if (nativeArea(event.target,dir)) return;
    const points=stops();
    if (points.length<2) return;
    if (event.cancelable) event.preventDefault();
    const now=performance.now();
    if (now-lastInput>400) gesture=false;
    lastInput=now;
    clearTimeout(release);
    release=setTimeout(()=>{gesture=false;},460);
    if (gesture || active) return;
    const current=window.scrollY;
    const next=dir>0 ? points.find(p=>p>current+16) : [...points].reverse().find(p=>p<current-16);
    if (next===undefined) return;
    gesture=true;
    animate(next);
  },{capture:true,passive:false});
  document.addEventListener('click', e=>{if(e.target.closest?.('a[href*="#"]')){cancel();gesture=true;clearTimeout(release);release=setTimeout(()=>gesture=false,400);}},true);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Home'||e.key==='End'){cancel();gesture=false;}});
  window.addEventListener('pagehide',cancel);
})();
</script>
<?php endif; ?>
<!-- This loader uses matchMedia, not user-agent strings or a paid detection API. -->
<script src="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/responsive/shared.js"></script>
</body></html>
