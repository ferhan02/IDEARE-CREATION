(() => {
  const $ = id => document.getElementById(id);
  const config = window.IDEARE_QUOTE_STAGE2 || {};
  if (!$('quoteCustomerId') || !config.customers) return;

  const customers = Array.isArray(config.customers) ? config.customers : [];
  const projects = Array.isArray(config.projects) ? config.projects : [];
  const measurements = Array.isArray(config.measurements) ? config.measurements : [];
  const designs = Array.isArray(config.designs) ? config.designs : [];
  const calculations = Array.isArray(config.calculations) ? config.calculations : [];
  const preselect = config.preselect || {};
  const urls = config.urls || {};

  const byId = rows => new Map(rows.map(row => [Number(row.id), row]));
  const customerMap = byId(customers);
  const projectMap = byId(projects);
  const measurementMap = byId(measurements);

  const escapeHtml = value => String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');

  const setValue = (id, value) => {
    const el=$(id);
    if(el) el.value=value ?? '';
  };

  function option(select, value, text, selected=false) {
    const el=document.createElement('option');
    el.value=String(value ?? '');
    el.textContent=text;
    el.selected=selected;
    select.appendChild(el);
    return el;
  }

  function projectLabel(row){
    const status=String(row.status||'').replaceAll('_',' ');
    return `${row.project_code || 'Project'} · ${row.name || 'Untitled'}${status ? ` · ${status}` : ''}`;
  }

  function measurementLabel(row){
    const when=row.measured_at ? new Date(String(row.measured_at).replace(' ','T')) : null;
    const date=when && !Number.isNaN(when.getTime())
      ? when.toLocaleDateString('en-MY',{day:'numeric',month:'short',year:'numeric'})
      : '';
    return `${row.room_name || 'Site measurement'}${date ? ` · ${date}` : ''}`;
  }

  function renderProjects(customerId, preferredId=0){
    const select=$('quoteProjectId');
    const selected=Number(preferredId || 0);
    select.innerHTML='';
    option(select,'','No linked project',selected===0);

    projects
      .filter(row => Number(row.customer_id)===Number(customerId))
      .forEach(row => option(select,row.id,projectLabel(row),Number(row.id)===selected));

    if(selected && !select.value) select.value='';
  }

  function renderMeasurements(projectId, preferredId=0){
    const select=$('quoteMeasurementId');
    const selected=Number(preferredId || 0);
    select.innerHTML='';

    if(!projectId){
      option(select,'','Choose a project first',true);
      select.disabled=true;
      renderMeasurementPreview(null);
      return;
    }

    select.disabled=false;
    option(select,'','No primary measurement linked',selected===0);

    measurements
      .filter(row => Number(row.project_id)===Number(projectId))
      .forEach(row => option(select,row.id,measurementLabel(row),Number(row.id)===selected));

    if(selected && !select.value) select.value='';
    renderMeasurementPreview(measurementMap.get(Number(select.value)) || null);
  }

  function sourceMatches(row, customerId, projectId){
    const rowCustomer=Number(row.customer_id || 0);
    const rowProject=Number(row.project_id || 0);

    if(projectId){
      if(rowProject===Number(projectId)) return true;
      return rowProject===0 && rowCustomer===Number(customerId);
    }

    return rowCustomer===Number(customerId) && rowProject===0;
  }

  function renderDesigns(customerId, projectId, preferredId=0){
    const select=$('quoteDesign');
    const selected=Number(preferredId || 0);
    select.innerHTML='';
    option(select,'','No linked design',selected===0);

    designs
      .filter(row => sourceMatches(row,customerId,projectId))
      .forEach(row => {
        const title=row.design_name || 'Untitled design';
        const el=option(select,row.id,`${row.design_code || 'Design'} · ${title}`,Number(row.id)===selected);
        el.dataset.code=row.design_code || '';
        el.dataset.customer=row.customer_name || '';
        el.dataset.email=row.customer_email || '';
        el.dataset.phone=row.customer_phone || '';
        el.dataset.room=row.room_type || '';
        el.dataset.price=row.estimated_price || '0';
      });

    if(selected && !select.value) select.value='';
  }

  function renderCalculations(customerId, projectId, preferredId=0){
    const select=$('quoteMaterialCalc');
    const selected=Number(preferredId || 0);
    select.innerHTML='';
    option(select,'','No saved material calculation',selected===0);

    calculations
      .filter(row => sourceMatches(row,customerId,projectId))
      .forEach(row => {
        const el=option(
          select,
          row.id,
          `${row.calculation_code || 'Calculation'} · ${row.calculation_name || 'Material calculation'}`,
          Number(row.id)===selected
        );
        el.dataset.material=row.total_material_cost || '0';
        el.dataset.waste=row.total_waste_cost || '0';
        el.dataset.total=row.total_cost || '0';
        el.dataset.customer=row.customer_name || '';
        el.dataset.designCode=row.design_code || '';
      });

    if(selected && !select.value) select.value='';
  }

  function renderSources(customerId, projectId, preferredDesign=0, preferredCalc=0){
    renderDesigns(customerId,projectId,preferredDesign);
    renderCalculations(customerId,projectId,preferredCalc);
  }

  function applyCustomer(customer, overwrite=true){
    if(!customer){
      if(overwrite){
        setValue('quoteCustomerName','');
        setValue('quoteCustomerEmail','');
        setValue('quoteCustomerPhone','');
        setValue('quoteCustomerBillingAddress','');
        setValue('quoteCustomerSiteAddress','');
      }
      $('quoteCustomerCodeLabel').textContent='Choose a CRM customer';
      $('summaryCustomerContext').textContent='No customer selected';
      $('quoteCustomerLink').href=urls.customer_list || '#';
      return;
    }

    if(overwrite){
      setValue('quoteCustomerName',customer.name || '');
      setValue('quoteCustomerEmail',customer.email || '');
      setValue('quoteCustomerPhone',customer.phone || '');
      setValue('quoteCustomerBillingAddress',customer.billing_address || '');
      setValue('quoteCustomerSiteAddress',customer.site_address || '');
    }

    $('quoteCustomerCodeLabel').textContent=`${customer.customer_code || 'Customer'} · ${customer.status || 'CRM record'}`;
    $('summaryCustomerContext').textContent=customer.name || 'Selected customer';
    if(urls.customer) $('quoteCustomerLink').href=urls.customer+customer.id;
  }

  function applyProject(project, overwrite=true){
    if(!project){
      if(overwrite){
        setValue('quoteProjectName','General quotation');
        setValue('quoteProjectType','');
        setValue('quoteSiteAddress',$('quoteCustomerSiteAddress')?.value || '');
      }
      $('quoteProjectCodeLabel').textContent='Optional customer-only quotation';
      $('quoteProjectStatusNote').textContent='Choose a project to connect this quotation to the project timeline.';
      $('summaryProjectContext').textContent='No linked project';
      $('quoteProjectLink').href=urls.project_list || '#';
      $('quoteMeasurementLink').href=urls.measurement_list || '#';
      return;
    }

    if(overwrite){
      setValue('quoteProjectName',project.name || 'General quotation');
      setValue('quoteProjectType',project.project_type || '');
      setValue('quoteSiteAddress',project.site_address || $('quoteCustomerSiteAddress')?.value || '');
    }

    const status=String(project.status||'').replaceAll('_',' ');
    $('quoteProjectCodeLabel').textContent=project.project_code || 'Linked project';
    $('quoteProjectStatusNote').textContent=`Project status: ${status || 'unknown'}${project.estimated_value ? ` · Estimated value RM ${Number(project.estimated_value).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2})}` : ''}`;
    $('summaryProjectContext').textContent=`${project.project_code || 'Project'} · ${project.name || ''}`;
    if(urls.project) $('quoteProjectLink').href=urls.project+project.id;
    if(urls.measurement) $('quoteMeasurementLink').href=urls.measurement+project.id;
  }

  function metric(label,value,unit='mm'){
    const numeric=Number(value || 0);
    if(!numeric) return '';
    return `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(numeric.toLocaleString('en-MY'))} ${escapeHtml(unit)}</b></span>`;
  }

  function noteRow(label,value){
    if(!value) return '';
    return `<div><b>${escapeHtml(label)}</b><p>${escapeHtml(value)}</p></div>`;
  }

  function renderMeasurementPreview(measurement){
    const wrap=$('quoteMeasurementPreview');
    if(!measurement){
      wrap.classList.add('is-empty');
      wrap.innerHTML='<div><strong>No measurement linked</strong><span>Select a project and measurement to preview the room dimensions and service notes here.</span></div>';
      return;
    }

    wrap.classList.remove('is-empty');
    const when=measurement.measured_at
      ? new Date(String(measurement.measured_at).replace(' ','T')).toLocaleString('en-MY',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'})
      : '';

    wrap.innerHTML=`
      <div class="quote-measurement-preview-head">
        <div>
          <strong>${escapeHtml(measurement.room_name || 'Site measurement')}</strong>
          <span>${escapeHtml(when)}${measurement.measured_by_name ? ` · ${escapeHtml(measurement.measured_by_name)}` : ''}</span>
        </div>
        <span class="pill">Primary reference</span>
      </div>
      <div class="quote-measurement-metrics">
        ${metric('Wall A',measurement.wall_a_mm)}
        ${metric('Wall B',measurement.wall_b_mm)}
        ${metric('Wall C',measurement.wall_c_mm)}
        ${metric('Wall D',measurement.wall_d_mm)}
        ${metric('Ceiling',measurement.ceiling_height_mm)}
      </div>
      <div class="quote-measurement-notes">
        ${noteRow('Windows',measurement.window_details)}
        ${noteRow('Doors',measurement.door_details)}
        ${noteRow('Plumbing',measurement.plumbing_details)}
        ${noteRow('Electrical',measurement.electrical_details)}
        ${noteRow('Obstacles',measurement.obstacles)}
        ${noteRow('Survey notes',measurement.notes)}
      </div>
    `;
  }

  function customerChanged(){
    const customerId=Number($('quoteCustomerId').value || 0);
    const customer=customerMap.get(customerId) || null;
    applyCustomer(customer,true);
    renderProjects(customerId,0);
    applyProject(null,true);
    renderMeasurements(0,0);
    renderSources(customerId,0,0,0);
  }

  function projectChanged(){
    const customerId=Number($('quoteCustomerId').value || 0);
    const projectId=Number($('quoteProjectId').value || 0);
    const project=projectMap.get(projectId) || null;

    if(project && Number(project.customer_id)!==customerId){
      $('quoteCustomerId').value=String(project.customer_id);
      applyCustomer(customerMap.get(Number(project.customer_id)) || null,true);
    }

    applyProject(project,true);
    renderMeasurements(projectId,0);
    renderSources(Number($('quoteCustomerId').value || 0),projectId,0,0);
  }

  $('quoteCustomerId').addEventListener('change',customerChanged);
  $('quoteProjectId').addEventListener('change',projectChanged);
  $('quoteMeasurementId').addEventListener('change',() => {
    renderMeasurementPreview(measurementMap.get(Number($('quoteMeasurementId').value || 0)) || null);
  });

  const initialCustomer=Number(preselect.customer_id || $('quoteCustomerId').value || 0);
  const initialProject=Number(preselect.project_id || 0);
  const initialMeasurement=Number(preselect.measurement_id || 0);

  if(initialCustomer){
    $('quoteCustomerId').value=String(initialCustomer);
    applyCustomer(customerMap.get(initialCustomer) || null,true);
    renderProjects(initialCustomer,initialProject);
    applyProject(projectMap.get(initialProject) || null,true);
    renderMeasurements(initialProject,initialMeasurement);
    renderSources(initialCustomer,initialProject,0,0);
  }else{
    applyCustomer(null,true);
    renderProjects(0,0);
    applyProject(null,true);
    renderMeasurements(0,0);
    renderSources(0,0,0,0);
  }

  window.IdeaREQuotationContext = {
    customer: () => customerMap.get(Number($('quoteCustomerId').value || 0)) || null,
    project: () => projectMap.get(Number($('quoteProjectId').value || 0)) || null,
    measurement: () => measurementMap.get(Number($('quoteMeasurementId').value || 0)) || null
  };
})();
