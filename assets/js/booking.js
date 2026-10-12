/* IDEARE | Three-step customer appointment form. No external JavaScript dependencies. */
(() => {
  const draftKey = 'ideare-booking-draft-v1';
  if (document.querySelector('[data-booking-success]')) {
    try { sessionStorage.removeItem(draftKey); } catch (_) {}
    return;
  }

  const form = document.getElementById('booking-form');
  if (!form) return;

  const panels = [...form.querySelectorAll('[data-step-panel]')];
  const markers = [...document.querySelectorAll('[data-step-marker]')];
  const progressFill = document.querySelector('[data-progress-fill]');
  const next = form.querySelector('[data-next]');
  const back = form.querySelector('[data-back]');
  const submit = form.querySelector('[data-submit]');
  const count = form.querySelector('[data-step-count]');
  const appointmentType = form.elements.namedItem('appointment_type');
  const addressWrap = form.querySelector('[data-address-wrap]');
  const addressInput = form.querySelector('[data-address-input]');
  const addressLabel = form.querySelector('[data-address-label]');
  const fileInput = form.querySelector('#booking-files');
  const fileList = form.querySelector('[data-file-list]');
  const summary = form.querySelector('[data-booking-summary]');
  const minDate = form.dataset.minDate;
  const maxDate = form.dataset.maxDate;
  let step = Math.max(1, Math.min(3, Number(form.dataset.startStep) || 1));

  const iconPaths = {
    building: '<path d="M3 21h18M5 21V4h14v17M9 8h2M14 8h2M9 12h2M14 12h2M9 16h2M14 16h2"/>',
    renovation: '<path d="M3 21h18M4 10 12 4l8 6v11H4zM8 21v-8h8v8M17 6l3-3"/>',
    interior: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 12h16M12 4v16M7 8h2M15 15h2"/>',
    cabinet: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M12 3v18M5 12h14M9 9h.01M15 16h.01"/>',
    furniture: '<path d="M5 12V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4M4 12h16v7H4zM6 19v2M18 19v2M2 12v5M22 12v5"/>',
    commercial: '<path d="M3 21h18M5 21V3h14v18M9 7h2M14 7h2M9 11h2M14 11h2M10 21v-5h4v5"/>',
    other: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.75c-1.3 1.2-1.8 1.7-1.8 3M12 17h.01"/>'
  };
  form.querySelectorAll('[data-service-icon]').forEach(icon => {
    icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[icon.dataset.serviceIcon] || iconPaths.other}</svg>`;
  });

  const get = name => {
    const field = form.elements.namedItem(name);
    if (!field) return '';
    if (field instanceof RadioNodeList) return field.value || '';
    return field.value || '';
  };
  const field = name => form.elements.namedItem(name);
  const selectedText = name => {
    const control = field(name);
    if (control instanceof HTMLSelectElement) return control.selectedOptions[0]?.textContent || '';
    if (control instanceof RadioNodeList) return [...control].find(r => r.checked)?.closest('label')?.textContent?.replace('✓', '').trim() || '';
    return String(get(name));
  };

  function clearError() { form.querySelectorAll('.booking-client-error').forEach(el => el.remove()); }
  function showError(message, focusTarget) {
    clearError();
    const container = panels[step - 1];
    const alert = document.createElement('div');
    alert.className = 'booking-client-error';
    alert.setAttribute('role', 'alert');
    alert.textContent = message;
    const heading = container.querySelector('.booking-panel-heading');
    heading.insertAdjacentElement('afterend', alert);
    if (focusTarget?.focus) focusTarget.focus({ preventScroll: true });
    alert.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function updateServiceContext() {
    const service = get('project_type');
    const focusLabel = form.querySelector('[data-focus-label]');
    const focusInput = form.querySelector('[data-focus-input]');
    const label = {
      new_construction: 'Project / building description',
      renovation: 'Which spaces need renovation?',
      interior_design: 'Which rooms or areas?',
      custom_cabinetry: 'Which cabinetry or room?',
      furnishing: 'What furniture or finishes?',
      commercial_fitout: 'Type of business / space?'
    }[service] || 'Which area or room?';
    focusLabel.textContent = label;
    const placeholders = {
      new_construction: 'e.g. Two-storey detached house',
      renovation: 'e.g. Kitchen, extension, bathrooms',
      custom_cabinetry: 'e.g. Wet kitchen, wardrobes',
      furnishing: 'e.g. Curtains and living room furniture',
      commercial_fitout: 'e.g. Retail shop, café, office'
    };
    focusInput.placeholder = placeholders[service] || 'e.g. Kitchen, whole house, office';
  }

  function updateAppointmentContext() {
    const siteSurvey = get('appointment_type') === 'site_measurement';
    const methodRadios = [...form.querySelectorAll('[name="consultation_method"]')];
    if (siteSurvey) {
      methodRadios.forEach(radio => {
        radio.checked = radio.value === 'onsite';
        radio.disabled = radio.value !== 'onsite';
      });
    } else {
      methodRadios.forEach(radio => { radio.disabled = false; });
    }
    const onsite = get('consultation_method') === 'onsite';
    addressWrap.hidden = !onsite;
    addressInput.required = onsite;
    addressLabel.innerHTML = onsite ? 'Property / meeting address <span class="booking-required">*</span>' : 'Location / address <span class="booking-optional">Optional</span>';
  }

  function renderSummary() {
    if (!summary) return;
    summary.replaceChildren();
    const rows = [
      ['Project', selectedText('project_type') || 'Not selected'],
      ['Property', selectedText('property_type') || 'Not selected'],
      ['Appointment', selectedText('appointment_type')],
      ['Meeting', selectedText('consultation_method')],
      ['Preferred date', get('requested_start') ? new Date(get('requested_start')).toLocaleString('en-MY', {dateStyle:'medium', timeStyle:'short'}) : 'Not selected'],
      ['Project area', get('project_location') || 'Not provided'],
      ['Estimated budget', get('budget_range') ? selectedText('budget_range') : 'Not provided']
    ];
    rows.forEach(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'booking-summary-row';
      const dt = document.createElement('dt'); dt.textContent = label;
      const dd = document.createElement('dd'); dd.textContent = value;
      row.append(dt, dd); summary.append(row);
    });
  }

  function showStep(number, scroll = false) {
    step = Math.min(3, Math.max(1, number));
    clearError();
    panels.forEach(panel => { panel.hidden = Number(panel.dataset.stepPanel) !== step; });
    markers.forEach(marker => {
      const n = Number(marker.dataset.stepMarker);
      marker.classList.toggle('is-current', n === step);
      marker.classList.toggle('is-complete', n < step);
      if (n === step) marker.setAttribute('aria-current', 'step');
      else marker.removeAttribute('aria-current');
    });
    progressFill.style.width = (step / 3 * 100) + '%';
    next.hidden = step === 3;
    submit.hidden = step !== 3;
    back.hidden = step === 1;
    count.textContent = `Step ${step} of 3`;
    if (step === 3) renderSummary();
    saveDraft();
    if (scroll) {
      const top = document.querySelector('.booking-section-heading').getBoundingClientRect().top + window.scrollY - 86;
      window.scrollTo({ top: Math.max(0,top), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }

  function validate(which) {
    clearError();
    if (which === 1) {
      const service = form.querySelector('[name="project_type"]:checked');
      if (!service) return showError('Please choose the service that best describes your project.',form.querySelector('[name="project_type"]')), false;
      if (!get('property_type')) return showError('Please choose your property type.', field('property_type')), false;
    }
    if (which === 2) {
      if (!get('appointment_type')) return showError('Choose an appointment type.',appointmentType), false;
      if (!get('consultation_method')) return showError('Choose how you would like to meet.',form.querySelector('[name="consultation_method"]')), false;
      const first = get('requested_start');
      const second = get('alternative_start');
      if (!first || first <= minDate || first > maxDate) return showError('Select a future appointment date within the next 12 months.',field('requested_start')), false;
      if (second && (second <= minDate || second > maxDate || second === first)) return showError('Choose a different, valid second date or leave it blank.',field('alternative_start')), false;
      if (get('consultation_method') === 'onsite' && !get('meeting_location').trim()) return showError('Please enter the address for your site visit.',addressInput), false;
    }
    if (which === 3) {
      const name = get('customer_name').trim();
      if (name.length < 2) return showError('Please enter your full name.',field('customer_name')), false;
      const phone = get('customer_phone').trim();
      const digits = phone.replace(/\D/g, '');
      if (!/^[+0-9 ()-]+$/.test(phone) || digits.length < 9 || digits.length > 15) return showError('Please enter a valid phone or WhatsApp number.',field('customer_phone')), false;
      const email = get('customer_email').trim();
      if (email && !field('customer_email').checkValidity()) return showError('Please enter a valid email address.',field('customer_email')), false;
      if (get('preferred_contact') === 'email' && !email) return showError('Please provide an email address for email follow-up.',field('customer_email')), false;
      const files = [...(fileInput.files || [])];
      if (files.length > 3) return showError('Please select no more than 3 files.',fileInput), false;
      if (files.some(file => file.size > 5 * 1024 * 1024 || file.size === 0 || !/\.(jpg|jpeg|png|webp|pdf)$/i.test(file.name))) return showError('Files must be JPG, PNG, WEBP or PDF and under 5 MB each.',fileInput), false;
      if (!form.querySelector('[name="privacy_consent"]').checked) return showError('Please agree to be contacted about your request.',field('privacy_consent')), false;
    }
    return true;
  }

  // Store only non-personal booking preferences for this browser tab, not names/contact details/files.
  const draftFields = ['project_type','property_type','project_stage','project_focus','project_size','budget_range','project_location','appointment_type','consultation_method','requested_start','alternative_start','meeting_location','project_notes'];
  function saveDraft() {
    try {
      const data = { step };
      draftFields.forEach(name => { data[name] = get(name); });
      sessionStorage.setItem(draftKey, JSON.stringify(data));
    } catch (_) {}
  }
  function restoreDraft() {
    if (form.dataset.startStep !== '1') return;
    // After a POST validation error, PHP repopulates form fields; don't override it.
    if (form.querySelector('[name="customer_name"]').value || get('project_type')) return;
    try {
      const draft = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
      if (!draft || typeof draft !== 'object') return;
      draftFields.forEach(name => {
        const value = draft[name];
        if (typeof value !== 'string') return;
        const control = field(name);
        if (control instanceof RadioNodeList) [...control].forEach(el => { el.checked = el.value === value; });
        else if (control) control.value = value;
      });
      step = Math.max(1, Math.min(3, Number(draft.step) || 1));
    } catch (_) {}
  }

  if (fileInput && fileList) {
    fileInput.addEventListener('change', () => {
      fileList.replaceChildren();
      [...fileInput.files].forEach(file => {
        const span = document.createElement('span');
        span.textContent = `${file.name} · ${(file.size / 1048576).toFixed(2)} MB`;
        fileList.append(span);
      });
      clearError();
    });
  }

  next.addEventListener('click', () => { if (validate(step)) showStep(step + 1, true); });
  back.addEventListener('click', () => showStep(step - 1, true));
  form.querySelectorAll('[data-edit-step]').forEach(button => button.addEventListener('click', () => showStep(Number(button.dataset.editStep), true)));
  form.querySelectorAll('input,select,textarea').forEach(control => {
    control.addEventListener('change', () => {
      if (control.name === 'project_type') updateServiceContext();
      if (control.name === 'appointment_type' || control.name === 'consultation_method') updateAppointmentContext();
      if (step === 3) renderSummary();
      saveDraft();
    });
    if (control.tagName === 'INPUT' || control.tagName === 'TEXTAREA') control.addEventListener('input', saveDraft);
  });
  form.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.matches('input:not([type=textarea]):not([type=file])')) {
      event.preventDefault();
      if (step < 3 && validate(step)) showStep(step + 1, true);
    }
  });
  form.addEventListener('submit', event => {
    for (let i = 1; i <= 3; i++) {
      if (i !== step) showStep(i);
      if (!validate(i)) { event.preventDefault(); return; }
    }
    submit.disabled = true;
    submit.textContent = 'Sending request…';
  });

  restoreDraft();
  updateServiceContext();
  updateAppointmentContext();
  showStep(step);
})();
