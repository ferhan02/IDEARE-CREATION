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
<!-- Orbit link-drag suppression and Firefox compositing optimizations. -->
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/orbit-browser-fix.css?v=20261117">
<script src="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/orbit-browser-fix.js?v=20261117"></script>
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
  const exclusions = '.ci-orbit-frame,.ci-orbit-area,.portfolio-viewport,[role="dialog"],dialog,.portfolio-modal,.portfolio-image-viewer,input,textarea,select,[contenteditable],[data-scroll-native],.modal';
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
<style id="ideare-whatsapp-style">
html body a.ideare-whatsapp-float {
  position: fixed; right: max(24px, env(safe-area-inset-right, 0px));
  bottom: max(24px, env(safe-area-inset-bottom, 0px));
  z-index: 10000; display: grid; place-items: center;
  width: 72px; height: 72px; padding: 0; margin: 0;
  border: 0; border-radius: 50%; background: #25d366 !important;
  color: #fff !important; text-decoration: none;
  box-shadow: 0 8px 24px rgba(14, 100, 49, .23);
  transition: transform .2s ease, box-shadow .2s ease;
  -webkit-tap-highlight-color: transparent;
}
.ideare-whatsapp-float svg { width: 61%; height: 61%; display: block; fill: #fff; pointer-events: none; }
@media (hover: hover) { html body a.ideare-whatsapp-float:hover { transform: translateY(-3px) scale(1.06); box-shadow: 0 12px 28px rgba(14,100,49,.3); } }
html body a.ideare-whatsapp-float:focus-visible { outline: 3px solid #fff; outline-offset: 3px; box-shadow: 0 0 0 6px #146b36; }
@media (max-width: 767px) { html body a.ideare-whatsapp-float { width: 58px; height: 58px; right: max(16px, env(safe-area-inset-right, 0px)); bottom: max(16px, env(safe-area-inset-bottom, 0px)); } }
@media (prefers-reduced-motion: reduce) { html body a.ideare-whatsapp-float { transition: none; } }
</style>
<a class="ideare-whatsapp-float" href="https://wa.me/60122267004?text=Hi%20IDEARE%21%20I%20have%20a%20project%20in%20mind%20and%20would%20love%20to%20discuss%20it%20with%20your%20team." target="_blank" rel="noopener noreferrer" aria-label="Chat with IDEARE on WhatsApp (opens in a new tab)" title="Chat with us on WhatsApp">
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.174.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.496.1-.198.05-.372-.025-.521-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.377l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.248c.002-5.446 4.433-9.878 9.888-9.878 2.64.001 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.993c-.003 5.446-4.434 9.878-9.885 9.878M20.465 3.45A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.587 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.478-8.451"/></svg>
</a>
<?php if (($idearePage ?? '') === 'home'): ?>
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/home-gallery-navigation.css?v=20261124">
<!-- Full-viewport homepage chapters: after compact and device-specific rules. -->
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/homepage-viewport.css?v=20261124">
<script>
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const update = () => document.documentElement.style.setProperty(
    '--ideare-measured-header', `${header.getBoundingClientRect().height}px`
  );
  update();
  window.addEventListener('resize', update, {passive:true});
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(update);
    observer.observe(header);
    window.addEventListener('pagehide', () => observer.disconnect(), {once:true});
  }
})();
</script>
<!-- Project exhibition: loaded after existing modal and theme styles; homepage carousel untouched. -->
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/portfolio-exhibition.css?v=20261124-exhibition-2">
<script src="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/portfolio-exhibition.js?v=20261124-exhibition-2"></script>
<?php endif; ?>
</body></html>
