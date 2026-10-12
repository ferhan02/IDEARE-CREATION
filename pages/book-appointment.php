<?php
require_once __DIR__.'/../includes/staff/feature-tools.php';
require_once __DIR__.'/../includes/customer/appointment-functions.php';

$pageTitle = 'Book a Consultation | IDEARE';
$pageStyles = ['assets/css/booking.css'];
$pageScripts = ['assets/js/booking.js'];
$customerRoot = '../';
$errors = [];
$errorStep = 1;
$confirmation = null;
$zone = new DateTimeZone('Asia/Kuala_Lumpur');
$now = new DateTimeImmutable('now', $zone);
$minDate = $now->format('Y-m-d\TH:i');
$maxDate = $now->modify('+12 months')->format('Y-m-d\TH:i');

if (isset($_GET['sent']) && !empty($_SESSION['booking_confirmation'])) {
    $confirmation = $_SESSION['booking_confirmation'];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    // Avoid silently losing fields when PHP discards a request beyond post_max_size.
    $read = static function (string $key): string {
        $value = $_POST[$key] ?? '';
        return is_string($value) ? trim($value) : '';
    };
    $projectType = $read('project_type');
    $propertyType = $read('property_type');
    $projectStage = $read('project_stage');
    $projectFocus = $read('project_focus');
    $projectSize = $read('project_size');
    $budgetRange = $read('budget_range');
    $projectLocation = $read('project_location');
    $appointmentType = $read('appointment_type');
    $consultationMethod = $read('consultation_method');
    $requestedRaw = $read('requested_start');
    $alternativeRaw = $read('alternative_start');
    $meetingLocation = $read('meeting_location');
    $customerName = $read('customer_name');
    $customerPhone = $read('customer_phone');
    $customerEmail = $read('customer_email');
    $preferredContact = $read('preferred_contact');
    $notes = $read('project_notes');

    if (!isset(booking_options()[$projectType])) $errors[] = 'Please choose the type of project.';
    if (!isset(booking_property_types()[$propertyType])) $errors[] = 'Please select a property type.';
    if ($projectStage !== '' && !isset(booking_stages()[$projectStage])) $errors[] = 'Choose a valid project stage.';
    if ($budgetRange !== '' && !isset(booking_budgets()[$budgetRange])) $errors[] = 'Choose a valid budget range.';
    foreach (['project_focus'=>$projectFocus, 'project_size'=>$projectSize, 'project_location'=>$projectLocation] as $field => $value) {
        if (strlen($value) > ($field === 'project_location' ? 255 : 120)) $errors[] = 'Please shorten your project details.';
    }
    if ($errors) $errorStep = 1;

    if (!isset(booking_appointment_types()[$appointmentType])) $errors[] = 'Choose a valid appointment type.';
    if (!isset(booking_methods()[$consultationMethod])) $errors[] = 'Choose how you would like to meet.';
    if ($appointmentType === 'site_measurement' && $consultationMethod !== 'onsite') $errors[] = 'Site measurements must take place at the property.';
    if ($consultationMethod === 'onsite' && $meetingLocation === '') $errors[] = 'Please enter the address for an on-site appointment.';
    if (strlen($meetingLocation) > 255) $errors[] = 'Please shorten the meeting address.';
    $requested = booking_date($requestedRaw, $zone);
    $alternative = $alternativeRaw === '' ? null : booking_date($alternativeRaw, $zone);
    if (!$requested || $requested <= $now || $requested > $now->modify('+12 months')) $errors[] = 'Choose a future appointment date within the next 12 months.';
    if ($alternativeRaw !== '' && (!$alternative || $alternative <= $now || $alternative > $now->modify('+12 months'))) $errors[] = 'Choose a valid alternative date or leave it blank.';
    if ($requested && $alternative && $requested == $alternative) $errors[] = 'Your alternative date must differ from your first choice.';
    if ($errors && $errorStep !== 1) $errorStep = 2;

    if (strlen($customerName) < 2 || strlen($customerName) > 120) $errors[] = 'Enter your name (2–120 characters).';
    $digits = preg_replace('/\D+/', '', $customerPhone);
    if (!preg_match('/^[+0-9 ()-]+$/', $customerPhone) || strlen($digits) < 9 || strlen($digits) > 15) {
        $errors[] = 'Enter a valid phone or WhatsApp number.';
    }
    if ($customerEmail !== '' && (strlen($customerEmail) > 190 || !filter_var($customerEmail, FILTER_VALIDATE_EMAIL))) {
        $errors[] = 'Enter a valid email address or leave it blank.';
    }
    if (!in_array($preferredContact, ['whatsapp','phone','email'], true)) $errors[] = 'Choose how we should contact you.';
    if ($preferredContact === 'email' && $customerEmail === '') $errors[] = 'Please provide an email address for email follow-up.';
    if (strlen($notes) > 1800) $errors[] = 'Please keep the project description under 1,800 characters.';
    if ($read('privacy_consent') !== 'yes') $errors[] = 'Please agree to be contacted about this enquiry.';
    // Find the first invalid section by checking which errors relate to each stage.
    if ($errors) {
        $stepOneValid = isset(booking_options()[$projectType], booking_property_types()[$propertyType])
            && ($projectStage === '' || isset(booking_stages()[$projectStage]))
            && ($budgetRange === '' || isset(booking_budgets()[$budgetRange]))
            && strlen($projectFocus) <= 120 && strlen($projectSize) <= 120 && strlen($projectLocation) <= 255;
        $stepTwoValid = isset(booking_appointment_types()[$appointmentType], booking_methods()[$consultationMethod])
            && ($appointmentType !== 'site_measurement' || $consultationMethod === 'onsite')
            && ($consultationMethod !== 'onsite' || $meetingLocation !== '')
            && strlen($meetingLocation) <= 255 && $requested && $requested > $now
            && $requested <= $now->modify('+12 months')
            && ($alternativeRaw === '' || ($alternative && $alternative > $now && $alternative <= $now->modify('+12 months') && $alternative != $requested));
        $errorStep = !$stepOneValid ? 1 : (!$stepTwoValid ? 2 : 3);
    }

    $files = [];
    if (!$errors) {
        try { $files = booking_selected_uploads(); }
        catch (Throwable $e) { $errors[] = $e->getMessage(); $errorStep = 3; }
    }
    if ($read('website') !== '') { $errors[] = 'Unable to submit this request.'; $errorStep = 3; }
    if (!empty($_SESSION['booking_last_sent']) && time() - (int)$_SESSION['booking_last_sent'] < 45) {
        $errors[] = 'Please wait a moment before submitting another request.';
        $errorStep = 3;
    }

    if (!$errors) {
        try {
            $pdo = staff_db();
            if (!db_table_exists($pdo, 'customer_appointments') || !db_table_exists($pdo, 'customer_appointment_details') || !db_table_exists($pdo, 'customer_appointment_attachments')) {
                throw new RuntimeException('Booking is temporarily unavailable. Please contact IdeaRE to arrange an appointment.');
            }
            $code = booking_create($pdo, [
                'project_type' => $projectType, 'property_type' => $propertyType, 'project_stage' => $projectStage,
                'project_focus' => $projectFocus, 'project_size' => $projectSize, 'budget_range' => $budgetRange,
                'project_location' => $projectLocation, 'appointment_type' => $appointmentType,
                'consultation_method' => $consultationMethod, 'requested_start' => $requested,
                'alternative_start' => $alternative, 'meeting_location' => $meetingLocation,
                'customer_name' => $customerName, 'customer_phone' => $customerPhone,
                'customer_email' => $customerEmail, 'preferred_contact' => $preferredContact,
                'project_notes' => $notes
            ], $files);
            $_SESSION['booking_last_sent'] = time();
            $_SESSION['booking_confirmation'] = [
                'code' => $code, 'name' => $customerName,
                'service' => booking_options()[$projectType],
                'date' => $requested->format('j M Y, g:i A'),
                'method' => booking_methods()[$consultationMethod]
            ];
            header('Location: '.ideare_root_url('pages/book-appointment.php?sent=1'), true, 303);
            exit;
        } catch (Throwable $e) {
            error_log('IDEARE booking error: '.$e->getMessage());
            $errors[] = 'We could not submit your request just now. Please try again or contact IdeaRE.';
            $errorStep = 3;
        }
    }
}

require __DIR__.'/../includes/customer/header.php';
?>
<main class="booking-page">
  <section class="booking-hero">
    <div class="site-wrap booking-hero-layout">
      <div class="booking-hero-copy">
        <p class="eyebrow">START YOUR PROJECT <span class="booking-eyebrow-line"></span> IDEARE</p>
        <h1>Let's build something <em>remarkable.</em></h1>
        <p class="booking-intro">From the first sketch to the final piece of furniture. Tell us about your space and let our team guide the next step.</p>
        <div class="booking-hero-points">
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M2 12h20"/></svg> One team, start to finish</span>
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12l6 6L21 5"/></svg> No obligation to proceed</span>
        </div>
      </div>
      <div class="booking-hero-art" aria-hidden="true">
        <div class="booking-art-arch"></div>
        <div class="booking-art-column booking-art-a"></div>
        <div class="booking-art-column booking-art-b"></div>
        <div class="booking-art-column booking-art-c"></div>
        <div class="booking-art-overlay"><span>01 / 03</span><strong>IDEAS INTO REALITY</strong><small>ARCHITECTURE · INTERIOR · BUILD</small></div>
      </div>
    </div>
  </section>

  <?php if ($confirmation): ?>
  <section class="site-wrap booking-result" aria-labelledby="booking-success-title" data-booking-success>
    <div class="booking-success-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></div>
    <p class="eyebrow">REQUEST RECEIVED</p>
    <h2 id="booking-success-title">Thank you, <?=h($confirmation['name'])?>.</h2>
    <p>We've received your request. Our team will review it and contact you to confirm a suitable time. <strong>This is a request, not a confirmed appointment yet.</strong></p>
    <div class="booking-result-details">
      <div><span>Reference</span><strong><?=h($confirmation['code'])?></strong></div>
      <div><span>Service</span><strong><?=h($confirmation['service'])?></strong></div>
      <div><span>Requested date</span><strong><?=h($confirmation['date'])?></strong></div>
      <div><span>Meeting preference</span><strong><?=h($confirmation['method'])?></strong></div>
      <div><span>Status</span><strong>Awaiting confirmation</strong></div>
    </div>
    <div class="booking-result-actions">
      <a href="<?=h(ideare_root_url('index.php'))?>" class="btn primary">Return to homepage</a>
      <a href="<?=h(ideare_root_url('public/pages/services.php'))?>" class="btn">Explore our services</a>
    </div>
  </section>
  <?php else: ?>
  <section class="site-wrap booking-main" aria-labelledby="booking-form-title">
    <noscript><p role="alert">Please enable JavaScript to complete the step-by-step appointment form.</p></noscript>
    <div class="booking-section-heading">
      <div><p class="eyebrow">YOUR NEXT STEP</p><h2 id="booking-form-title">Book a consultation</h2></div>
      <p>It takes just a few minutes. We'll confirm the appointment with you personally.</p>
    </div>
    <div class="booking-layout">
      <aside class="booking-sidebar" aria-label="Booking progress">
        <div class="booking-sidebar-inner">
          <p class="booking-sidebar-kicker">YOUR BOOKING</p>
          <ol class="booking-steps">
            <li data-step-marker="1" class="is-current"><span class="booking-step-num">01</span><span><strong>Your project</strong><small>What would you like to do?</small></span></li>
            <li data-step-marker="2"><span class="booking-step-num">02</span><span><strong>Appointment</strong><small>When and where?</small></span></li>
            <li data-step-marker="3"><span class="booking-step-num">03</span><span><strong>Your details</strong><small>How do we reach you?</small></span></li>
          </ol>
          <div class="booking-side-note"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg><p>Still figuring things out? That's okay. The project budget and most details are optional.</p></div>
        </div>
      </aside>

      <div class="booking-form-card">
        <div class="booking-progress" aria-label="Form progress"><div class="booking-progress-fill" style="width:33.333%" data-progress-fill></div></div>
        <?php if ($errors): ?>
        <div role="alert" class="booking-error" tabindex="-1" id="booking-form-error">
          <strong>Let's check a few things.</strong>
          <ul><?php foreach (array_unique($errors) as $error): ?><li><?=h($error)?></li><?php endforeach; ?></ul>
        </div>
        <?php endif; ?>
        <form method="post" id="booking-form" enctype="multipart/form-data" novalidate data-start-step="<?=$errorStep?>" data-min-date="<?=h($minDate)?>" data-max-date="<?=h($maxDate)?>">
          <?=csrf_field()?>
          <div class="booking-honeypot" aria-hidden="true"><label>Website<input tabindex="-1" autocomplete="off" name="website"></label></div>

          <section class="booking-step-panel" data-step-panel="1" aria-labelledby="booking-step-one-title">
            <div class="booking-panel-heading"><span class="booking-index">01 / ABOUT YOUR PROJECT</span><h3 id="booking-step-one-title">What do you have in mind?</h3><p>Choose the closest match. We can work through the finer details together.</p></div>
            <fieldset class="booking-fieldset">
              <legend>I'm interested in <span class="booking-required">*</span></legend>
              <div class="booking-service-grid">
                <?php
                  $icons = ['new_construction'=>'building', 'renovation'=>'renovation', 'interior_design'=>'interior', 'custom_cabinetry'=>'cabinet', 'furnishing'=>'furniture', 'commercial_fitout'=>'commercial', 'other'=>'other'];
                  foreach (booking_options() as $value => $label):
                ?>
                <label class="booking-service-choice"><input type="radio" name="project_type" value="<?=h($value)?>" <?=booking_old('project_type')===$value?'checked':''?> required><span class="booking-choice-icon" aria-hidden="true" data-service-icon="<?=h($icons[$value])?>"></span><span class="booking-choice-text"><?=h($label)?></span><span class="booking-check-indicator" aria-hidden="true">✓</span></label>
                <?php endforeach; ?>
              </div>
            </fieldset>
            <div class="booking-fields-two">
              <label class="booking-field">Property type <span class="booking-required">*</span><select name="property_type" required><option value="">Select property type</option><?php foreach (booking_property_types() as $v=>$label): ?><option value="<?=h($v)?>" <?=booking_old('property_type')===$v?'selected':''?>><?=h($label)?></option><?php endforeach; ?></select></label>
              <label class="booking-field">Current stage <span class="booking-optional">Optional</span><select name="project_stage"><option value="">Choose a stage</option><?php foreach (booking_stages() as $v=>$label): ?><option value="<?=h($v)?>" <?=booking_old('project_stage')===$v?'selected':''?>><?=h($label)?></option><?php endforeach; ?></select></label>
            </div>
            <div class="booking-fields-two">
              <label class="booking-field"><span data-focus-label>Which area or room?</span> <span class="booking-optional">Optional</span><input type="text" name="project_focus" maxlength="120" value="<?=booking_old('project_focus')?>" placeholder="e.g. Kitchen, whole house, office" data-focus-input></label>
              <label class="booking-field">Approximate size <span class="booking-optional">Optional</span><input type="text" name="project_size" maxlength="120" value="<?=booking_old('project_size')?>" placeholder="e.g. 2,000 sq ft / 12 ft kitchen"></label>
            </div>
            <div class="booking-fields-two">
              <label class="booking-field">Project area <span class="booking-optional">Optional</span><input type="text" name="project_location" maxlength="255" value="<?=booking_old('project_location')?>" placeholder="e.g. Seremban, Negeri Sembilan"></label>
              <label class="booking-field">Estimated budget <span class="booking-optional">Optional</span><select name="budget_range"><option value="">Prefer not to say</option><?php foreach (booking_budgets() as $v=>$label): ?><option value="<?=h($v)?>" <?=booking_old('budget_range')===$v?'selected':''?>><?=h($label)?></option><?php endforeach; ?></select></label>
            </div>
          </section>

          <section class="booking-step-panel" data-step-panel="2" aria-labelledby="booking-step-two-title" hidden>
            <div class="booking-panel-heading"><span class="booking-index">02 / LET'S MEET</span><h3 id="booking-step-two-title">How should we meet?</h3><p>Choose your preferred appointment. We'll check the schedule and confirm with you.</p></div>
            <label class="booking-field">Appointment type <span class="booking-required">*</span><select name="appointment_type" required><?php foreach (booking_appointment_types() as $v=>$label): ?><option value="<?=h($v)?>" <?=booking_old('appointment_type','consultation')===$v?'selected':''?>><?=h($label)?></option><?php endforeach; ?></select></label>
            <fieldset class="booking-fieldset booking-methods"><legend>Preferred meeting method <span class="booking-required">*</span></legend>
              <div class="booking-method-grid"><?php foreach (booking_methods() as $value=>$label): ?><label class="booking-method-choice"><input type="radio" name="consultation_method" value="<?=h($value)?>" <?=booking_old('consultation_method','showroom')===$value?'checked':''?> required><span class="booking-method-dot"></span><strong><?=h($label)?></strong></label><?php endforeach; ?></div>
            </fieldset>
            <div class="booking-fields-two">
              <label class="booking-field">Preferred date & time <span class="booking-required">*</span><input type="datetime-local" name="requested_start" required min="<?=h($minDate)?>" max="<?=h($maxDate)?>" value="<?=booking_old('requested_start')?>"><small>Malaysia time (MYT, UTC+8). Subject to confirmation.</small></label>
              <label class="booking-field">Second choice <span class="booking-optional">Optional</span><input type="datetime-local" name="alternative_start" min="<?=h($minDate)?>" max="<?=h($maxDate)?>" value="<?=booking_old('alternative_start')?>"><small>Helpful if your first choice is unavailable.</small></label>
            </div>
            <label class="booking-field" data-address-wrap hidden><span data-address-label>Property / meeting address <span class="booking-required">*</span></span><input name="meeting_location" maxlength="255" value="<?=booking_old('meeting_location')?>" placeholder="Address, postcode and town" data-address-input></label>
            <div class="booking-inline-note"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> Your preferred time is a request. An IdeaRE team member will confirm the actual appointment.</div>
          </section>

          <section class="booking-step-panel" data-step-panel="3" aria-labelledby="booking-step-three-title" hidden>
            <div class="booking-panel-heading"><span class="booking-index">03 / FINAL DETAILS</span><h3 id="booking-step-three-title">Almost there.</h3><p>Tell us how to reach you and share anything that would help us prepare.</p></div>
            <label class="booking-field">Full name <span class="booking-required">*</span><input type="text" name="customer_name" autocomplete="name" maxlength="120" value="<?=booking_old('customer_name')?>" placeholder="Your name" required></label>
            <div class="booking-fields-two">
              <label class="booking-field">Phone / WhatsApp number <span class="booking-required">*</span><input type="tel" name="customer_phone" autocomplete="tel" inputmode="tel" maxlength="25" value="<?=booking_old('customer_phone')?>" placeholder="e.g. 012-345 6789" required></label>
              <label class="booking-field">Email address <span class="booking-optional">Optional</span><input type="email" name="customer_email" autocomplete="email" maxlength="190" value="<?=booking_old('customer_email')?>" placeholder="you@example.com"></label>
            </div>
            <fieldset class="booking-fieldset booking-contact-pref"><legend>How should we contact you? <span class="booking-required">*</span></legend>
              <div class="booking-contact-options"><?php foreach (['whatsapp'=>'WhatsApp', 'phone'=>'Phone call', 'email'=>'Email'] as $v=>$label): ?><label><input type="radio" name="preferred_contact" value="<?=h($v)?>" <?=booking_old('preferred_contact','whatsapp')===$v?'checked':''?> required><span><?=h($label)?></span></label><?php endforeach; ?></div>
            </fieldset>
            <label class="booking-field">Anything else we should know? <span class="booking-optional">Optional</span><textarea name="project_notes" rows="4" maxlength="1800" placeholder="Your goals, preferred style, concerns, important deadlines, or what you'd like to discuss..."><?=booking_old('project_notes')?></textarea></label>
            <div class="booking-upload-section">
              <div class="booking-upload-heading"><span>Have photos, drawings or inspiration?</span><span class="booking-optional">Optional</span></div>
              <label class="booking-upload-area" for="booking-files"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M8 8l4-4 4 4M4 15v5h16v-5"/></svg><strong>Choose files to attach</strong><small>PDF, JPG, PNG or WEBP · Up to 3 files · 5 MB each</small><input id="booking-files" type="file" name="references[]" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple></label>
              <div class="booking-file-list" data-file-list aria-live="polite"></div>
              <small class="booking-upload-tip">Images and plans are viewed only by authorised staff handling your request.</small>
            </div>
            <div class="booking-summary"><div class="booking-summary-heading"><strong>Review your request</strong><button type="button" data-edit-step="1">Edit project</button></div><dl data-booking-summary></dl></div>
            <label class="booking-consent"><input type="checkbox" name="privacy_consent" value="yes" <?=booking_old('privacy_consent')==='yes'?'checked':''?> required><span>I agree that IdeaRE may use the details I provide to contact me about this appointment request. <span class="booking-required">*</span></span></label>
          </section>

          <div class="booking-form-footer"><button type="button" class="btn booking-back" data-back hidden>← Back</button><span class="booking-step-count" data-step-count>Step 1 of 3</span><button type="button" class="btn primary booking-next" data-next>Continue →</button><button type="submit" class="btn primary booking-submit" data-submit hidden>Request appointment →</button></div>
        </form>
      </div>

      <aside class="booking-help">
        <div class="booking-help-card"><p class="eyebrow">WHAT HAPPENS NEXT?</p><h3>We'll take it from here.</h3>
          <div class="booking-help-item"><span>01</span><div><strong>We review your request</strong><p>Our team looks through the project details and any images you've sent.</p></div></div>
          <div class="booking-help-item"><span>02</span><div><strong>We confirm your appointment</strong><p>We'll contact you via your preferred channel to agree on a suitable time.</p></div></div>
          <div class="booking-help-item"><span>03</span><div><strong>We plan the next steps</strong><p>Meet with our team and discuss the right approach for your space.</p></div></div>
        </div>
        <div class="booking-help-secondary"><strong>Already have measurements?</strong><p>Feel free to prepare floor plans, site photos or reference images. You can attach them to your request.</p><a href="<?=h(ideare_root_url('designer/index.php'))?>">Explore Cabinet Designer <span aria-hidden="true">↗</span></a></div>
      </aside>
    </div>
  </section>
  <?php endif; ?>
</main>
<?php require __DIR__.'/../includes/customer/footer.php'; ?>
