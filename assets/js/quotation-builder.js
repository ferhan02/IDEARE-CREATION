(() => {
  const $ = id => document.getElementById(id);
  if (!$('saveQuoteForm') || !$('quoteGroupRows')) return;

  const config = window.IDEARE_QUOTE_STAGE3 || {};
  const permissions = config.permissions || {};
  const settings = config.settings || {};
  const rateBook = Array.isArray(config.rateBook) ? config.rateBook : [];
  const rateMap = new Map(rateBook.map(row => [Number(row.id), row]));

  let seq = 0;
  const uid = prefix => `${prefix}_${Date.now().toString(36)}_${(++seq).toString(36)}`;
  let activeRateSection = null;
  let groups = [];
  let charges = [];

  const money = value => new Intl.NumberFormat('en-MY', {
    style:'currency', currency:'MYR'
  }).format(Number(value || 0));

  const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const round = value => Math.round((n(value) + Number.EPSILON) * 100) / 100;
  const escapeHtml = value => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function toMetres(value, unit){
    value=n(value);
    if(unit==='mm') return value/1000;
    if(unit==='cm') return value/100;
    if(unit==='ft') return value*0.3048;
    if(unit==='in') return value*0.0254;
    return value;
  }
  const toFeet = (value,unit) => toMetres(value,unit)/0.3048;

  function pricingBasis(item){
    const method=item.is_foc ? (item.base_pricing_method || 'quantity') : item.pricing_method;
    const qty=Math.max(0,n(item.quantity || 1));
    const width=Math.max(0,n(item.width_value));
    const height=Math.max(0,n(item.height_value));
    const unit=item.measurement_unit || 'm';
    const count=qty>0 ? qty : 1;
    if(method==='running_ft') return width>0 ? toFeet(width,unit)*count : qty;
    if(method==='running_m') return width>0 ? toMetres(width,unit)*count : qty;
    if(method==='area_sqft') return width>0 && height>0 ? toFeet(width,unit)*toFeet(height,unit)*count : qty;
    if(method==='area_sqm') return width>0 && height>0 ? toMetres(width,unit)*toMetres(height,unit)*count : qty;
    if(method==='dimension'){
      if(width>0 && height>0){
        const sqft=String(item.unit||'').toLowerCase().includes('sqft');
        return sqft ? toFeet(width,unit)*toFeet(height,unit)*count : toMetres(width,unit)*toMetres(height,unit)*count;
      }
      return qty;
    }
    if(method==='fixed' || method==='lump_sum') return 1;
    return qty;
  }

  function nextGroupCode(){
    const used=new Set(groups.map(group=>String(group.group_code||'').toUpperCase()));
    if(!used.has('MAIN')) return 'MAIN';
    let index=2;
    while(used.has(`G${index}`)) index++;
    return `G${index}`;
  }

  function nextSectionCode(){
    const used=new Set(groups.flatMap(group=>group.sections||[]).map(section=>String(section.section_code||'').toUpperCase()));
    for(let i=0;i<26;i++){
      const code=String.fromCharCode(65+i);
      if(!used.has(code)) return code;
    }
    let nCode=27;
    while(used.has(`S${nCode}`)) nCode++;
    return `S${nCode}`;
  }

  function makeGroup(data={}){
    const key=data.client_key || uid('g');
    return {
      client_key:key,
      group_code:data.group_code || nextGroupCode(),
      group_name:data.group_name || (groups.length ? 'Additional Works' : 'Main Works'),
      group_type:data.group_type || (groups.length ? 'additional' : 'standard'),
      pricing_mode:data.pricing_mode || 'itemized',
      package_target_total:n(data.package_target_total),
      show_on_customer_quote:data.show_on_customer_quote ?? true,
      show_breakdown:data.show_breakdown ?? true,
      notes:data.notes || '',
      sections:Array.isArray(data.sections) && data.sections.length ? data.sections : [makeSection({section_code:nextSectionCode(),section_name:'General Works'},key)]
    };
  }

  function makeSection(data={},groupKey=''){
    return {
      client_key:data.client_key || uid('s'),
      group_client_key:groupKey,
      section_code:data.section_code || 'A',
      section_name:data.section_name || 'General Works',
      description:data.description || '',
      show_on_customer_quote:data.show_on_customer_quote ?? true,
      show_section_total:data.show_section_total ?? true,
      items:Array.isArray(data.items) ? data.items : []
    };
  }

  function makeItem(data={}){
    const rate=data.rate_book_item_id ? rateMap.get(Number(data.rate_book_item_id)) : null;
    const method=data.pricing_method || rate?.pricing_method || 'quantity';
    const standard=n(data.standard_unit_price ?? rate?.standard_selling_rate ?? data.unit_price ?? 0);
    return {
      client_key:data.client_key || uid('i'),
      rate_book_item_id:rate ? Number(rate.id) : null,
      item_type:data.item_type || rate?.item_type || 'other',
      pricing_method:method,
      base_pricing_method:data.base_pricing_method || (method==='foc' ? (rate?.pricing_method || 'quantity') : method),
      description:data.description || rate?.name || 'Quotation item',
      measurement_text:data.measurement_text || '',
      width_value:data.width_value ?? '',
      height_value:data.height_value ?? '',
      depth_value:data.depth_value ?? '',
      measurement_unit:data.measurement_unit || 'ft',
      quantity:n(data.quantity ?? 1),
      unit:data.unit || rate?.default_unit || 'unit',
      unit_price:n(data.unit_price ?? standard),
      standard_unit_price:standard,
      internal_unit_cost:n(data.internal_unit_cost ?? rate?.internal_cost_rate ?? 0),
      is_foc:!!data.is_foc,
      foc_reason:data.foc_reason || '',
      override_reason:data.override_reason || '',
      show_on_customer_quote:data.show_on_customer_quote ?? true,
      taxable:data.taxable ?? (rate ? Number(rate.taxable)===1 : true),
      source_type:data.source_type || (rate ? 'rate_book' : 'manual'),
      source_id:data.source_id || null,
      source_reference:data.source_reference || rate?.rate_code || '',
      notes:data.notes || ''
    };
  }

  function makeCharge(data={}){
    return {
      client_key:data.client_key || uid('c'),
      group_client_key:data.group_client_key || '',
      section_client_key:data.section_client_key || '',
      charge_code:data.charge_code || '',
      charge_name:data.charge_name || 'Additional Charge',
      charge_category:data.charge_category || 'other',
      calculation_type:data.calculation_type || 'fixed',
      calculation_base:data.calculation_base || 'manual',
      rate:n(data.default_rate ?? data.rate ?? 0),
      base_amount:n(data.base_amount ?? 0),
      internal_only:Number(data.internal_only || 0)===1 || data.internal_only===true,
      taxable:Number(data.taxable ?? 1)===1 || data.taxable===true,
      source_type:data.source_type || 'manual',
      source_id:data.source_id || null,
      source_reference:data.source_reference || '',
      notes:data.notes || ''
    };
  }

  function findSection(key){
    for(const group of groups){
      const section=group.sections.find(s=>s.client_key===key);
      if(section) return {group,section};
    }
    return null;
  }

  function sectionOptions(selected=''){
    let html='<option value="">Quotation level</option>';
    groups.forEach(group=>group.sections.forEach(section=>{
      html+=`<option value="${escapeHtml(section.client_key)}" ${section.client_key===selected?'selected':''}>${escapeHtml(group.group_name)} · ${escapeHtml(section.section_code)} ${escapeHtml(section.section_name)}</option>`;
    }));
    return html;
  }

  function methodOptions(selected){
    const methods=[
      ['quantity','Quantity'],['running_ft','Running ft'],['running_m','Running m'],['area_sqft','Area sq ft'],['area_sqm','Area sq m'],
      ['set','Set'],['lump_sum','Lump sum'],['fixed','Fixed'],['dimension','Dimension'],['manual','Manual']
    ];
    return methods.map(([value,label])=>`<option value="${value}" ${value===selected?'selected':''}>${label}</option>`).join('');
  }

  function renderGroups(){
    const wrap=$('quoteGroupRows');
    wrap.innerHTML='';

    groups.forEach((group,gIndex)=>{
      const totals=calculateGroup(group);
      const card=document.createElement('article');
      card.className='quote-group-card';
      card.dataset.groupKey=group.client_key;
      card.innerHTML=`
        <div class="quote-group-head">
          <div class="quote-group-title-fields">
            <input class="quote-group-code" data-group-field="group_code" value="${escapeHtml(group.group_code)}" aria-label="Group code">
            <input class="quote-group-name" data-group-field="group_name" value="${escapeHtml(group.group_name)}" aria-label="Group name">
          </div>
          <div class="quote-group-controls">
            <select data-group-field="group_type" aria-label="Group type">
              <option value="standard" ${group.group_type==='standard'?'selected':''}>Standard</option>
              <option value="package" ${group.group_type==='package'?'selected':''}>Package</option>
              <option value="additional" ${group.group_type==='additional'?'selected':''}>Additional works</option>
            </select>
            <select data-group-field="pricing_mode" aria-label="Group pricing" ${permissions.packagePrice?'':'disabled'}>
              <option value="itemized" ${group.pricing_mode==='itemized'?'selected':''}>Itemized</option>
              <option value="package_target" ${group.pricing_mode==='package_target'?'selected':''}>Package target</option>
              <option value="manual_total" ${group.pricing_mode==='manual_total'?'selected':''}>Manual group total</option>
            </select>
            <button class="btn" type="button" data-add-section>Add section</button>
            ${groups.length>1?'<button class="btn danger" type="button" data-remove-group>Remove</button>':''}
          </div>
        </div>
        <div class="quote-group-commercial ${group.pricing_mode==='itemized'?'is-itemized':''}">
          <label>Itemized value<input value="${money(totals.itemSubtotal)}" readonly></label>
          <label>Package / group target<input data-group-field="package_target_total" type="number" min="0" step=".01" value="${group.package_target_total || ''}" ${group.pricing_mode==='itemized'?'disabled':''}></label>
          <label>Group adjustment<input value="${money(totals.adjustment)}" readonly></label>
          <label>Customer group total<input value="${money(totals.finalTotal)}" readonly></label>
          <label class="check"><input data-group-field="show_breakdown" type="checkbox" ${group.show_breakdown?'checked':''}> Show breakdown</label>
        </div>
        <div class="quote-section-stack"></div>
      `;

      const sectionWrap=card.querySelector('.quote-section-stack');
      group.sections.forEach((section,sIndex)=>sectionWrap.appendChild(renderSection(group,section,gIndex,sIndex)));

      card.querySelectorAll('[data-group-field]').forEach(input=>{
        const event=input.type==='checkbox'?'change':'input';
        input.addEventListener(event,e=>{
          const field=e.target.dataset.groupField;
          group[field]=e.target.type==='checkbox'?e.target.checked:(field==='package_target_total'?n(e.target.value):e.target.value);
          if(field==='pricing_mode') renderGroups(); else calculate();
        });
        if(input.tagName==='SELECT') input.addEventListener('change',e=>{
          const field=e.target.dataset.groupField;
          group[field]=e.target.value;
          renderGroups();
        });
      });

      card.querySelector('[data-add-section]').addEventListener('click',()=>{
        group.sections.push(makeSection({section_code:nextSectionCode(),section_name:'New Section'},group.client_key));
        renderGroups();
      });
      card.querySelector('[data-remove-group]')?.addEventListener('click',async()=>{
        if(await confirmAction('Remove quotation group?','All sections and items inside this group will be removed.')){
          groups.splice(gIndex,1); renderGroups(); renderCharges();
        }
      });
      wrap.appendChild(card);
    });
    calculate();
  }

  function renderSection(group,section,gIndex,sIndex){
    const sectionEl=document.createElement('section');
    sectionEl.className='quote-section-card';
    sectionEl.dataset.sectionKey=section.client_key;
    sectionEl.innerHTML=`
      <div class="quote-section-head">
        <div class="quote-section-title-fields">
          <input class="quote-section-code" data-section-field="section_code" value="${escapeHtml(section.section_code)}" aria-label="Section code">
          <input class="quote-section-name" data-section-field="section_name" value="${escapeHtml(section.section_name)}" aria-label="Section name">
        </div>
        <div class="actions">
          <button class="btn" type="button" data-rate>Add Rate Book item</button>
          <button class="btn" type="button" data-manual>Add manual item</button>
          ${group.sections.length>1?'<button class="btn danger" type="button" data-remove-section>Remove</button>':''}
        </div>
      </div>
      <textarea class="quote-section-description" data-section-field="description" rows="2" placeholder="Optional section description...">${escapeHtml(section.description)}</textarea>
      <div class="quote-item-table-head"><span>Source / Description</span><span>Pricing</span><span>Measure / Qty</span><span>Selling</span>${permissions.viewCost?'<span>Internal</span>':''}<span>FOC</span><span></span></div>
      <div class="quote-items"></div>
      <div class="quote-section-foot"><label class="check"><input data-section-field="show_section_total" type="checkbox" ${section.show_section_total?'checked':''}> Show section total</label><strong data-section-total>${money(calculateSection(section).customer)}</strong></div>
    `;

    const itemsWrap=sectionEl.querySelector('.quote-items');
    section.items.forEach((item,iIndex)=>itemsWrap.appendChild(renderItem(group,section,item,iIndex)));
    if(!section.items.length){
      const empty=document.createElement('div'); empty.className='quote-items-empty'; empty.textContent='No items yet. Add a Rate Book item or a manual line.'; itemsWrap.appendChild(empty);
    }

    sectionEl.querySelectorAll('[data-section-field]').forEach(input=>{
      const handler=e=>{
        const field=e.target.dataset.sectionField;
        section[field]=e.target.type==='checkbox'?e.target.checked:e.target.value;
        calculate();
      };
      input.addEventListener(input.type==='checkbox'?'change':'input',handler);
    });
    sectionEl.querySelector('[data-rate]').addEventListener('click',()=>openRateBook(section.client_key));
    sectionEl.querySelector('[data-manual]').addEventListener('click',()=>{
      section.items.push(makeItem()); renderGroups();
    });
    sectionEl.querySelector('[data-remove-section]')?.addEventListener('click',async()=>{
      if(await confirmAction('Remove section?','Every item inside this section will be removed.')){
        group.sections.splice(sIndex,1); renderGroups(); renderCharges();
      }
    });
    return sectionEl;
  }

  function renderItem(group,section,item,iIndex){
    const rate=item.rate_book_item_id ? rateMap.get(Number(item.rate_book_item_id)) : null;
    const basis=pricingBasis(item);
    const standard=round(basis*n(item.standard_unit_price));
    const amount=item.is_foc?0:round(basis*n(item.unit_price));
    const baseInternal=round(basis*n(item.internal_unit_cost));
    const wastePct=rate?Math.max(0,n(rate.default_waste_percent)):0;
    const waste=round(baseInternal*wastePct/100);
    const internal=round(baseInternal+waste);
    const overridden=rate && Math.abs(n(item.unit_price)-n(item.standard_unit_price))>0.0001;

    const row=document.createElement('div');
    row.className=`quote-scope-item ${item.is_foc?'is-foc':''} ${overridden?'is-overridden':''}`;
    row.innerHTML=`
      <div class="quote-item-description-cell">
        <div class="quote-source-line">
          <span class="quote-source-badge ${rate?'is-rate':'is-manual'}">${rate?escapeHtml(rate.rate_code):item.source_type==='material_calculation'?'Material calc':'Manual'}</span>
          ${overridden?'<span class="quote-source-badge is-warning">Overridden</span>':''}
        </div>
        <input data-field="description" value="${escapeHtml(item.description)}" placeholder="Description">
        <select data-field="item_type">
          ${['material','cabinet','countertop','hardware','labour','installation','delivery','electrical','plumbing','ceiling','renovation','door_glass','service','subcontractor','other'].map(v=>`<option value="${v}" ${item.item_type===v?'selected':''}>${v.replaceAll('_',' ')}</option>`).join('')}
        </select>
      </div>
      <div class="quote-item-pricing-cell">
        <select data-field="pricing_method" ${item.is_foc||rate?'disabled':''}>${methodOptions(item.base_pricing_method || item.pricing_method)}</select>
        <small>${rate?`Standard ${money(item.standard_unit_price)} / ${escapeHtml(item.unit||'unit')}`:'Custom pricing'}</small>
      </div>
      <div class="quote-item-measure-cell">
        <div class="quote-dimension-grid">
          <input data-field="width_value" type="number" min="0" step=".001" value="${escapeHtml(item.width_value)}" placeholder="W">
          <input data-field="height_value" type="number" min="0" step=".001" value="${escapeHtml(item.height_value)}" placeholder="H">
          <input data-field="depth_value" type="number" min="0" step=".001" value="${escapeHtml(item.depth_value)}" placeholder="D">
          <select data-field="measurement_unit">${['mm','cm','m','ft','in'].map(v=>`<option value="${v}" ${item.measurement_unit===v?'selected':''}>${v}</option>`).join('')}</select>
        </div>
        <div class="quote-qty-grid"><input data-field="quantity" type="number" min="0" step=".001" value="${item.quantity}" placeholder="Qty/count"><input data-field="unit" value="${escapeHtml(item.unit)}" placeholder="Unit"></div>
        <small>Priced basis: ${basis.toLocaleString('en-MY',{maximumFractionDigits:3})} ${escapeHtml(item.unit||'')}</small>
      </div>
      <div class="quote-item-selling-cell">
        <input data-field="unit_price" type="number" min="0" step=".01" value="${item.unit_price}" ${rate && !permissions.overridePrice?'readonly':''} ${item.is_foc?'disabled':''}>
        <strong>${item.is_foc?'FOC':money(amount)}</strong>
        ${item.is_foc?`<small>Retail value ${money(standard)}</small>`:''}
      </div>
      ${permissions.viewCost?`<div class="quote-item-cost-cell"><input data-field="internal_unit_cost" type="number" min="0" step=".01" value="${item.internal_unit_cost}" ${rate?'readonly':''}><strong>${money(internal)}</strong>${rate && wastePct>0?`<small>Includes ${wastePct}% waste</small>`:''}</div>`:''}
      <div class="quote-item-foc-cell"><label class="check"><input data-field="is_foc" type="checkbox" ${item.is_foc?'checked':''}> FOC</label><label class="check"><input data-field="show_on_customer_quote" type="checkbox" ${item.show_on_customer_quote?'checked':''}> Show</label></div>
      <button type="button" class="btn danger quote-item-remove" data-remove>×</button>
      <div class="quote-item-reasons ${item.is_foc||overridden?'is-visible':''}">
        ${item.is_foc?`<label>FOC reason<input data-field="foc_reason" value="${escapeHtml(item.foc_reason)}" placeholder="Why is this item free?"></label>`:''}
        ${overridden?`<label>Price override reason<input data-field="override_reason" value="${escapeHtml(item.override_reason)}" placeholder="Why was the standard rate changed?"></label>`:''}
        <label>Line notes<input data-field="notes" value="${escapeHtml(item.notes)}" placeholder="Internal / scope note"></label>
      </div>
    `;

    row.querySelectorAll('[data-field]').forEach(input=>{
      const field=input.dataset.field;
      const event=input.type==='checkbox' || input.tagName==='SELECT' ? 'change' : 'input';
      const update=e=>{
        let value=e.target.type==='checkbox'?e.target.checked:e.target.value;
        if(['width_value','height_value','depth_value','quantity','unit_price','internal_unit_cost'].includes(field) && value!=='') value=n(value);
        item[field]=value;
        if(field==='pricing_method') item.base_pricing_method=value;
        if(field==='is_foc'){
          item.is_foc=!!value;
          item.pricing_method=item.is_foc?'foc':(item.base_pricing_method||'quantity');
          renderGroups();
          return;
        }
        if(field==='unit_price' && rate && Math.abs(n(value)-n(item.standard_unit_price))<0.0001) item.override_reason='';
        calculate();
        if(field==='pricing_method' || field==='measurement_unit') renderGroups();
      };
      input.addEventListener(event,update);

      // Do not rebuild the entire quotation on every numeric keystroke. Rebuild
      // after the field is committed so priced-basis/override labels refresh
      // without stealing focus while staff are typing.
      if(input.tagName!=='SELECT' && input.type!=='checkbox' &&
         ['width_value','height_value','depth_value','quantity','unit','unit_price','internal_unit_cost'].includes(field)){
        input.addEventListener('change',()=>renderGroups());
      }
    });
    row.querySelector('[data-remove]').addEventListener('click',async()=>{
      if(await confirmAction('Remove quotation item?','This line will be removed from the section.')){
        section.items.splice(iIndex,1); renderGroups();
      }
    });
    return row;
  }

  function calculateSection(section){
    let customer=0,standard=0,internal=0,foc=0,waste=0;
    section.items.forEach(item=>{
      const basis=pricingBasis(item);
      const standardAmount=round(basis*n(item.standard_unit_price));
      const rate=item.rate_book_item_id?rateMap.get(Number(item.rate_book_item_id)):null;
      const baseInternal=round(basis*n(item.internal_unit_cost));
      const itemWaste=round(baseInternal*(rate?Math.max(0,n(rate.default_waste_percent)):0)/100);
      standard+=standardAmount;
      internal+=round(baseInternal+itemWaste);
      waste+=itemWaste;
      if(item.is_foc) foc+=standardAmount;
      else customer+=round(basis*n(item.unit_price));
    });
    return {customer:round(customer),standard:round(standard),internal:round(internal),foc:round(foc),waste:round(waste)};
  }

  function calculateGroup(group){
    let itemSubtotal=0,standard=0,internal=0,foc=0,waste=0;
    group.sections.forEach(section=>{
      const t=calculateSection(section);
      itemSubtotal+=t.customer; standard+=t.standard; internal+=t.internal; foc+=t.foc; waste+=t.waste;
    });
    itemSubtotal=round(itemSubtotal); standard=round(standard); internal=round(internal); foc=round(foc); waste=round(waste);
    const finalTotal=group.pricing_mode==='itemized' ? itemSubtotal : Math.max(0,n(group.package_target_total));
    return {itemSubtotal,standard,internal,foc,waste,finalTotal:round(finalTotal),adjustment:round(finalTotal-itemSubtotal)};
  }

  function chargeAmount(charge, snapshot){
    const rate=Math.max(0,n(charge.rate));
    let base=Math.max(0,n(charge.base_amount));
    if(charge.calculation_type==='percentage'){
      if(charge.calculation_base==='direct_cost') base=snapshot.directCost;
      else if(charge.calculation_base==='internal_cost') base=snapshot.directCost;
      else if(charge.calculation_base==='selling_subtotal') base=snapshot.groupCustomerTotal + snapshot.customerChargeTotal;
      else if(charge.calculation_base==='group_subtotal'){
        const group=groups.find(g=>g.client_key===charge.group_client_key);
        base=group?calculateGroup(group).finalTotal:0;
      }else if(charge.calculation_base==='section_subtotal'){
        const match=findSection(charge.section_client_key);
        base=match?calculateSection(match.section).customer:0;
      }
      return {base,amount:round(base*rate/100)};
    }
    if(['per_unit','per_hour','per_day','per_trip'].includes(charge.calculation_type)) return {base,amount:round(base*rate)};
    return {base:0,amount:round(rate)};
  }

  function calculate(){
    let groupCustomerTotal=0,itemStandard=0,directItemCost=0,focValue=0,commercialAdjustment=0,embeddedWaste=0;
    groups.forEach(group=>{
      const t=calculateGroup(group);
      groupCustomerTotal+=t.finalTotal; itemStandard+=t.standard; directItemCost+=t.internal; focValue+=t.foc; commercialAdjustment+=t.adjustment; embeddedWaste+=t.waste;
    });
    groupCustomerTotal=round(groupCustomerTotal); itemStandard=round(itemStandard); directItemCost=round(directItemCost);

    let internalChargeTotal=0,customerChargeTotal=0,wasteCost=0;
    const snapshot={directCost:directItemCost,groupCustomerTotal,customerChargeTotal:0};
    charges.forEach(charge=>{
      snapshot.directCost=round(directItemCost+internalChargeTotal);
      snapshot.customerChargeTotal=customerChargeTotal;
      const result=chargeAmount(charge,snapshot);
      charge._calculated_base=result.base; charge._amount=result.amount;
      if(charge.internal_only){
        internalChargeTotal+=result.amount;
        if(charge.charge_category==='waste') wasteCost+=result.amount;
      }else customerChargeTotal+=result.amount;
    });

    const directCost=round(directItemCost+internalChargeTotal);
    const overheadPct=Math.max(0,n($('quoteOverheadPct')?.value));
    const contingencyPct=Math.max(0,n($('quoteContingencyPct')?.value));
    const overhead=round(directCost*overheadPct/100);
    const contingency=round(directCost*contingencyPct/100);
    const internalCost=round(directCost+overhead+contingency);
    const standardSelling=round(itemStandard+customerChargeTotal);
    const selling=round(groupCustomerTotal+customerChargeTotal);

    const discountType=$('quoteDiscountType')?.value || 'none';
    const discountValue=Math.max(0,n($('quoteDiscountValue')?.value));
    let discount=0;
    if(discountType==='percentage') discount=round(selling*discountValue/100);
    else if(discountType==='fixed') discount=round(discountValue);
    discount=Math.min(discount,selling);
    const subtotal=round(Math.max(0,selling-discount));
    const taxPct=Math.max(0,n($('quoteTaxPct')?.value));
    const tax=round(subtotal*taxPct/100);
    const finalTotal=round(subtotal+tax);
    const grossProfit=round(subtotal-internalCost);
    const margin=subtotal>0 ? (grossProfit/subtotal)*100 : 0;

    if($('summaryDirectCost')) $('summaryDirectCost').textContent=money(directCost);
    if($('summaryOverhead')) $('summaryOverhead').textContent=money(overhead);
    if($('summaryContingency')) $('summaryContingency').textContent=money(contingency);
    if($('summaryInternalCost')) $('summaryInternalCost').textContent=money(internalCost);
    $('summaryStandardSelling').textContent=money(standardSelling);
    $('summaryCommercialAdjustment').textContent=(commercialAdjustment<0?'- ':'')+money(Math.abs(commercialAdjustment));
    $('summaryFocValue').textContent=money(focValue);
    $('summarySelling').textContent=money(selling);
    $('summaryDiscount').textContent=discount?'- '+money(discount):money(0);
    $('summarySubtotal').textContent=money(subtotal);
    $('summaryTax').textContent=money(tax);
    $('summaryFinal').textContent=money(finalTotal);
    if($('summaryMargin')) $('summaryMargin').textContent=`${margin.toFixed(1)}%`;

    document.querySelectorAll('[data-section-total]').forEach(el=>{
      const sectionEl=el.closest('[data-section-key]');
      const match=findSection(sectionEl?.dataset.sectionKey || '');
      if(match) el.textContent=money(calculateSection(match.section).customer);
    });

    return {direct_cost:directCost,waste_cost:round(embeddedWaste+wasteCost),overhead_amount:overhead,contingency_amount:contingency,internal_cost:internalCost,standard_selling_price:standardSelling,commercial_adjustment_amount:round(commercialAdjustment),foc_retail_value:round(focValue),selling_price_before_discount:selling,discount_type:discountType,discount_value:discountValue,discount_amount:discount,subtotal,tax_percent:taxPct,tax_amount:tax,final_total:finalTotal,gross_profit:grossProfit,gross_margin_percent:margin};
  }

  function renderCharges(){
    const wrap=$('quoteChargeRows');
    wrap.innerHTML='';
    charges.forEach((charge,index)=>{
      const row=document.createElement('div');
      row.className='quote-charge-row stage3-charge';
      row.innerHTML=`
        <input data-field="charge_name" value="${escapeHtml(charge.charge_name)}" placeholder="Charge name">
        <select data-field="charge_category">${['labour','installation','delivery','transport','measurement','design','subcontractor','waste','overhead','contingency','consumables','machine','disposal','parking_toll','surcharge','other'].map(v=>`<option value="${v}" ${charge.charge_category===v?'selected':''}>${v.replaceAll('_',' ')}</option>`).join('')}</select>
        <select data-field="calculation_type"><option value="fixed" ${charge.calculation_type==='fixed'?'selected':''}>Fixed</option><option value="percentage" ${charge.calculation_type==='percentage'?'selected':''}>Percentage</option><option value="per_unit" ${charge.calculation_type==='per_unit'?'selected':''}>Per unit</option><option value="per_hour" ${charge.calculation_type==='per_hour'?'selected':''}>Per hour</option><option value="per_day" ${charge.calculation_type==='per_day'?'selected':''}>Per day</option><option value="per_trip" ${charge.calculation_type==='per_trip'?'selected':''}>Per trip</option></select>
        <select data-field="calculation_base"><option value="manual" ${charge.calculation_base==='manual'?'selected':''}>Manual base</option><option value="direct_cost" ${charge.calculation_base==='direct_cost'?'selected':''}>Direct cost</option><option value="selling_subtotal" ${charge.calculation_base==='selling_subtotal'?'selected':''}>Selling subtotal</option></select>
        <input data-field="base_amount" type="number" min="0" step=".01" value="${charge.base_amount}" placeholder="Base / qty">
        <input data-field="rate" type="number" min="0" step=".01" value="${charge.rate}" placeholder="Rate">
        <strong data-charge-amount>${money(charge._amount||charge.rate)}</strong>
        ${permissions.viewCost?`<label class="quote-visible-toggle"><input data-field="internal_only" type="checkbox" ${charge.internal_only?'checked':''}> Internal</label>`:'<span class="quote-charge-public-label">Customer charge</span>'}
        <button type="button" class="btn danger" data-remove>×</button>
      `;
      row.querySelectorAll('[data-field]').forEach(input=>{
        const event=input.type==='checkbox' || input.tagName==='SELECT'?'change':'input';
        input.addEventListener(event,e=>{
          const field=e.target.dataset.field;
          let value=e.target.type==='checkbox'?e.target.checked:e.target.value;
          if(['base_amount','rate'].includes(field)) value=n(value);
          charge[field]=value;
          calculate(); renderChargeAmounts();
        });
      });
      row.querySelector('[data-remove]').addEventListener('click',()=>{charges.splice(index,1);renderCharges();});
      wrap.appendChild(row);
    });
    renderChargeAmounts(); calculate();
  }

  function renderChargeAmounts(){
    const snapshot=calculate();
    document.querySelectorAll('.stage3-charge').forEach((row,index)=>{
      const el=row.querySelector('[data-charge-amount]'); if(el) el.textContent=money(charges[index]?._amount||0);
    });
    return snapshot;
  }

  function openRateBook(sectionKey){
    activeRateSection=sectionKey || groups[0]?.sections[0]?.client_key || null;
    const modal=$('quoteRateModal');
    if(!modal) return;
    modal.hidden=false; document.body.classList.add('quote-modal-open');
    $('rateBookSearch').value=''; $('rateBookCategory').value=''; renderRateBook(); $('rateBookSearch').focus();
  }
  function closeRateBook(){ $('quoteRateModal').hidden=true; document.body.classList.remove('quote-modal-open'); }

  function renderRateBook(){
    const wrap=$('rateBookResults');
    const search=String($('rateBookSearch').value||'').toLowerCase().trim();
    const category=$('rateBookCategory').value;
    const filtered=rateBook.filter(row=>{
      if(category && String(row.category_code)!==category) return false;
      if(!search) return true;
      return `${row.rate_code} ${row.name} ${row.description||''} ${row.category_name}`.toLowerCase().includes(search);
    });
    wrap.innerHTML=filtered.length ? filtered.map(row=>`
      <button type="button" class="quote-rate-result" data-rate-id="${row.id}">
        <span><small>${escapeHtml(row.category_name)} · ${escapeHtml(row.rate_code)}</small><b>${escapeHtml(row.name)}</b><em>${escapeHtml(row.description||'')}</em></span>
        <span class="quote-rate-result-price"><b>${money(row.standard_selling_rate)}</b><small>per ${escapeHtml(row.default_unit||'unit')}</small>${permissions.viewCost?`<em>Internal ${money(row.internal_cost_rate)}</em>`:''}</span>
      </button>`).join('') : '<div class="quotation-empty-state"><strong>No Rate Book items found</strong><span>Try another search or add rates in Quotation Settings.</span></div>';
    wrap.querySelectorAll('[data-rate-id]').forEach(btn=>btn.addEventListener('click',()=>{
      const match=findSection(activeRateSection); const rate=rateMap.get(Number(btn.dataset.rateId));
      if(!match || !rate) return;
      match.section.items.push(makeItem({rate_book_item_id:Number(rate.id),quantity:1,measurement_unit:'ft'}));
      closeRateBook(); renderGroups();
    }));
  }

  function initRateBook(){
    const categories=[...new Map(rateBook.map(row=>[row.category_code,row.category_name])).entries()];
    categories.forEach(([code,name])=>{
      const opt=document.createElement('option');opt.value=code;opt.textContent=name;$('rateBookCategory').appendChild(opt);
    });
    $('openRateBookBtn')?.addEventListener('click',()=>openRateBook(groups[0]?.sections[0]?.client_key));
    $('closeRateBookBtn')?.addEventListener('click',closeRateBook);
    $('quoteRateModal')?.addEventListener('click',e=>{if(e.target===$('quoteRateModal')) closeRateBook();});
    $('rateBookSearch')?.addEventListener('input',renderRateBook);
    $('rateBookCategory')?.addEventListener('change',renderRateBook);
    document.addEventListener('keydown',e=>{if(e.key==='Escape' && !$('quoteRateModal')?.hidden) closeRateBook();});
  }

  async function confirmAction(title,text){
    if(window.IdeaREAlert){
      const r=await IdeaREAlert.confirm({title,text,confirmText:'Remove',cancelText:'Cancel',danger:true});
      return !!r.isConfirmed;
    }
    return window.confirm(title);
  }

  function useDesign(){
    const select=$('quoteDesign');
    groups.forEach(group=>group.sections.forEach(section=>{
      section.items=section.items.filter(item=>item.source_type!=='design');
    }));
    const option=select?.options[select.selectedIndex];
    if(!select?.value || !option){renderGroups();return;}
    if(option.dataset.price && n(option.dataset.price)>0){
      const first=groups[0]?.sections[0];
      if(first){
        first.items.push(makeItem({item_type:'cabinet',description:`Cabinet system based on ${option.dataset.code||'saved design'}`,pricing_method:'lump_sum',base_pricing_method:'lump_sum',quantity:1,unit:'job',unit_price:n(option.dataset.price),standard_unit_price:n(option.dataset.price),internal_unit_cost:0,source_type:'design',source_id:n(select.value),source_reference:option.dataset.code||''}));
      }
    }
    renderGroups();
  }

  function useMaterialCalculation(){
    const select=$('quoteMaterialCalc');
    groups.forEach(group=>group.sections.forEach(section=>{
      section.items=section.items.filter(item=>item.source_type!=='material_calculation');
    }));
    charges=charges.filter(charge=>charge.source_type!=='material_calculation_waste');
    if(!select?.value){renderGroups();renderCharges();return;}
    const option=select.options[select.selectedIndex];
    const material=n(option.dataset.material); const waste=n(option.dataset.waste);
    const first=groups[0]?.sections[0];
    if(first){
      first.items.push(makeItem({item_type:'material',description:`Internal materials · ${option.textContent.split(' · ')[0]}`,pricing_method:'fixed',base_pricing_method:'fixed',quantity:1,unit:'job',unit_price:0,standard_unit_price:0,internal_unit_cost:material,show_on_customer_quote:false,source_type:'material_calculation',source_id:n(select.value),source_reference:option.textContent.split(' · ')[0]}));
    }
    charges.push(makeCharge({charge_name:'Material waste allowance',charge_category:'waste',calculation_type:'fixed',rate:waste,internal_only:true,taxable:false,source_type:'material_calculation_waste',source_id:n(select.value),source_reference:option.textContent.split(' · ')[0]}));
    renderGroups(); renderCharges();
  }


  function clearInvalidSourceReferences(){
    const designId=n($('quoteDesign')?.value);
    const calculationId=n($('quoteMaterialCalc')?.value);
    let changed=false;
    groups.forEach(group=>group.sections.forEach(section=>{
      const before=section.items.length;
      section.items=section.items.filter(item=>{
        if(item.source_type==='design') return designId>0 && n(item.source_id)===designId;
        if(item.source_type==='material_calculation') return calculationId>0 && n(item.source_id)===calculationId;
        return true;
      });
      if(before!==section.items.length) changed=true;
    }));
    const beforeCharges=charges.length;
    charges=charges.filter(charge=>charge.source_type!=='material_calculation_waste' || (calculationId>0 && n(charge.source_id)===calculationId));
    if(beforeCharges!==charges.length) changed=true;
    if(changed){renderGroups();renderCharges();}
  }

  function payload(){
    calculate();
    const design=$('quoteDesign'); const designOption=design?.options[design.selectedIndex];
    return {
      customer_id:$('quoteCustomerId')?.value||null, project_id:$('quoteProjectId')?.value||null, site_measurement_id:$('quoteMeasurementId')?.value||null,
      salesperson_id:$('quoteSalespersonId')?.value||null, design_id:design?.value||null, design_code:designOption?.dataset.code||'', material_calculation_id:$('quoteMaterialCalc')?.value||null,
      customer_name:$('quoteCustomerName').value.trim(), customer_email:$('quoteCustomerEmail').value.trim(), customer_phone:$('quoteCustomerPhone').value.trim(),
      customer_billing_address_snapshot:$('quoteCustomerBillingAddress')?.value.trim()||'', customer_site_address_snapshot:$('quoteCustomerSiteAddress')?.value.trim()||'',
      project_name:$('quoteProjectName').value.trim(), project_type:$('quoteProjectType').value.trim(), site_address_snapshot:$('quoteSiteAddress')?.value.trim()||'',
      quotation_title:$('quoteTitle')?.value.trim()||'', reference_no:$('quoteReferenceNo')?.value.trim()||'', quotation_date:$('quoteDate').value, valid_until:$('quoteValidUntil').value,
      overhead_percent:n($('quoteOverheadPct')?.value), contingency_percent:n($('quoteContingencyPct')?.value), markup_type:$('quoteMarkupType')?.value||'percentage', markup_value:n($('quoteMarkupValue')?.value),
      discount_type:$('quoteDiscountType')?.value||'none', discount_value:n($('quoteDiscountValue')?.value), tax_name:$('quoteTaxName').value.trim(), tax_percent:n($('quoteTaxPct')?.value),
      internal_notes:$('quoteInternalNotes').value.trim(), customer_notes:$('quoteCustomerNotes').value.trim(), terms_and_conditions:$('quoteTerms').value.trim(),
      groups:groups.map(group=>({...group,sections:group.sections.map(section=>({...section,items:section.items.map(item=>({...item}))}))})),
      charges:charges.map(charge=>({...charge,base_amount:charge.calculation_type==='percentage'?n(charge.base_amount):n(charge.base_amount)}))
    };
  }

  function validatePayload(p){
    if(!p.customer_id) return ['CRM customer required','Choose a customer from CRM before saving the quotation.','quoteCustomerId'];
    if(!p.customer_name) return ['Customer name required','Enter the customer name that should appear on this quotation.','quoteCustomerName'];
    const items=p.groups.flatMap(g=>g.sections.flatMap(s=>s.items));
    if(!items.length && !p.charges.length) return ['Quotation is empty','Add at least one quotation item or charge.','addQuoteGroupBtn'];
    for(const group of p.groups){
      if(group.pricing_mode!=='itemized' && !permissions.packagePrice) return ['Package pricing restricted','Your account cannot set package or manual group totals.',''];
      for(const section of group.sections){
        for(const item of section.items){
          const rate=item.rate_book_item_id?rateMap.get(Number(item.rate_book_item_id)):null;
          if(item.is_foc && settings.requireFocReason && !String(item.foc_reason||'').trim()) return ['FOC reason required',`Explain why “${item.description}” is FOC.`,''];
          if(rate && Math.abs(n(item.unit_price)-n(item.standard_unit_price))>0.0001 && settings.requireOverrideReason && !String(item.override_reason||'').trim()) return ['Override reason required',`Explain why the Rate Book price was changed for “${item.description}”.`,''];
        }
      }
    }
    return null;
  }

  $('addQuoteGroupBtn')?.addEventListener('click',()=>{groups.push(makeGroup());renderGroups();renderCharges();});
  $('addChargeBtn')?.addEventListener('click',()=>{charges.push(makeCharge());renderCharges();});
  document.querySelectorAll('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>{try{charges.push(makeCharge(JSON.parse(btn.dataset.preset)));renderCharges();}catch(e){}}));
  $('quoteDesign')?.addEventListener('change',useDesign);
  $('quoteMaterialCalc')?.addEventListener('change',useMaterialCalculation);
  $('quoteCustomerId')?.addEventListener('change',clearInvalidSourceReferences);
  $('quoteProjectId')?.addEventListener('change',clearInvalidSourceReferences);
  ['quoteOverheadPct','quoteContingencyPct','quoteMarkupType','quoteMarkupValue','quoteDiscountType','quoteDiscountValue','quoteTaxPct'].forEach(id=>{
    $(id)?.addEventListener('input',calculate); $(id)?.addEventListener('change',calculate);
  });

  $('saveQuoteForm').addEventListener('submit',e=>{
    const p=payload(); const problem=validatePayload(p);
    if(problem){
      e.preventDefault();
      window.IdeaREAlert ? IdeaREAlert.warning(problem[0],problem[1]) : alert(problem[1]);
      if(problem[2]) $(problem[2])?.focus();
      return;
    }
    $('quotePayload').value=JSON.stringify(p);
  });

  groups=[makeGroup({group_code:'MAIN',group_name:'Main Works',group_type:'standard',sections:[makeSection({section_code:'A',section_name:'General Works'},'')]})];
  groups[0].sections[0].group_client_key=groups[0].client_key;
  initRateBook(); renderGroups(); renderCharges(); calculate();
})();
