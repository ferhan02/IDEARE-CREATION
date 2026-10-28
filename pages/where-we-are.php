<?php
$pageTitle = 'Where We Are | IDEARE';
require __DIR__ . '/../includes/customer/header.php';
?>
<main class="location-page">
  <section class="site-wrap location-hero" aria-labelledby="location-title">
    <div class="location-hero-copy">
      <p class="eyebrow">VISIT IDEARE</p>
      <h1 id="location-title">Where we are<span class="location-period">.</span></h1>
      <p class="location-lead">Come find us. Explore our location on the map, open directions, or get in touch before making your visit.</p>
      <div class="location-hero-actions">
        <a class="btn primary location-primary-action" href="https://www.google.com/maps/search/?api=1&query=2.645643821113305%2C101.93519266151304" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 11 18-8-8 18-2.5-7.5L3 11Z"/><path d="M10.5 13.5 21 3"/></svg> Get directions <span aria-hidden="true">↗</span></a>
        <a class="btn location-secondary-action" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>pages/book-appointment.php">Book a consultation <span aria-hidden="true">↗</span></a>
      </div>
    </div>
    <div class="location-hero-mark" aria-hidden="true">
      <svg viewBox="0 0 160 200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M144 75c0 43-64 112-64 112S16 118 16 75a64 64 0 1 1 128 0Z"/><circle cx="80" cy="75" r="23"/></svg>
    </div>
  </section>
  <section class="site-wrap location-main-section" aria-labelledby="location-map-title">
    <div class="location-section-heading"><div><p class="eyebrow">OUR LOCATION</p><h2 id="location-map-title">Find us on the map</h2></div><p>Use the interactive map to explore the surrounding area. For navigation, select “Get directions”.</p></div>
    <div class="location-map-shell">
      <iframe title="Google Maps showing the IDEARE location provided by the company" src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d350.29385447195887!2d101.93519266151304!3d2.645643821113305!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2smy!4v1792573849984!5m2!1sen!2smy" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
    </div>
    <div class="location-map-caption"><span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/></svg> Location based on the Google Maps pin supplied by IDEARE.</span><a href="https://www.google.com/maps/search/?api=1&query=2.645643821113305%2C101.93519266151304" target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a></div>
  </section>
  <section class="site-wrap location-next-section" aria-label="Plan your visit"><div class="location-next-copy"><p class="eyebrow">PLAN YOUR VISIT</p><h2>Have a project in mind?</h2><p>Whether you're planning a full build, renovation or custom cabinetry, book a consultation and our team will confirm the details with you.</p></div><a class="btn primary" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>pages/book-appointment.php">Request an appointment <span aria-hidden="true">↗</span></a></section>
</main>
<?php require __DIR__ . '/../includes/customer/footer.php'; ?>
