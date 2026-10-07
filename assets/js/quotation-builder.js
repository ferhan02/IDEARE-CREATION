(() => {
  const $ = id => document.getElementById(id);
  if (!$('saveQuoteForm')) return;

  let items = [];
  let charges = [];

  const canViewCost = !!window.IDEARE_QUOTE_CAN_VIEW_COST;

  const money = value =>
    new Intl.NumberFormat('en-MY', {
      style:'currency',
      currency:'MYR'
    }).format(Number(value || 0));

  function addItem(data = {}) {
    items.push({
      item_type: data.item_type || 'cabinet',
      description: data.description || 'Cabinet work',
      quantity: Number(data.quantity ?? 1),
      unit: data.unit || 'job',
      unit_price: Number(data.unit_price ?? 0),
      internal_unit_cost: Number(data.internal_unit_cost ?? 0),
      show_on_customer_quote: data.show_on_customer_quote ?? true,
      notes: data.notes || ''
    });

    renderItems();
  }

  function addCharge(data = {}) {
    charges.push({
      charge_code: data.charge_code || '',
      charge_name: data.charge_name || 'Additional Charge',
      charge_category: data.charge_category || 'other',
      calculation_type: data.calculation_type || 'fixed',
      rate: Number(data.default_rate ?? data.rate ?? 0),
      base_amount: 0,
      amount: 0,
      internal_only: Number(data.internal_only || 0) === 1,
      taxable: Number(data.taxable ?? 1) === 1,
      notes: data.notes || ''
    });

    renderCharges();
  }

  function renderItems() {
    const wrap = $('quoteItemRows');
    wrap.innerHTML = '';

    items.forEach((item,index) => {
      const row = document.createElement('div');
      row.className = 'quote-item-row';

      row.innerHTML = `
        <select data-field="item_type">
          ${['material','cabinet','hardware','labour','installation','delivery','service','other']
            .map(v=>`<option value="${v}" ${item.item_type===v?'selected':''}>${v.replace('_',' ')}</option>`)
            .join('')}
        </select>

        <input data-field="description" value="${escapeHtml(item.description)}" placeholder="Description">
        <input data-field="quantity" type="number" min="0" step=".001" value="${item.quantity}" placeholder="Qty">
        <input data-field="unit" value="${escapeHtml(item.unit)}" placeholder="Unit">
        <input data-field="unit_price" type="number" min="0" step=".01" value="${item.unit_price}" placeholder="Selling price">

        ${canViewCost ? `
        <input data-field="internal_unit_cost" type="number" min="0" step=".01" value="${item.internal_unit_cost}" placeholder="Internal cost">
        ` : ''}

        <label class="quote-visible-toggle">
          <input data-field="show_on_customer_quote" type="checkbox" ${item.show_on_customer_quote?'checked':''}>
          Show
        </label>

        <button type="button" class="btn danger" data-remove="${index}">×</button>
      `;

      row.querySelectorAll('[data-field]').forEach(input => {
        input.addEventListener('input', e => {
          const field=e.target.dataset.field;
          let value=e.target.type==='checkbox' ? e.target.checked : e.target.value;

          if(['quantity','unit_price','internal_unit_cost'].includes(field)){
            value=Number(value||0);
          }

          items[index][field]=value;
          calculate();
        });
      });

      row.querySelector('[data-remove]').addEventListener('click', async () => {
        let confirmed=true;

        if(window.IdeaREAlert){
          const result=await IdeaREAlert.confirm({
            title:'Remove quotation item?',
            text:'This line will be removed from the quotation.',
            confirmText:'Remove',
            cancelText:'Cancel',
            danger:true
          });

          confirmed=result.isConfirmed;
        }

        if(confirmed){
          items.splice(index,1);
          renderItems();
        }
      });

      wrap.appendChild(row);
    });

    calculate();
  }

  function renderCharges() {
    const wrap=$('quoteChargeRows');
    wrap.innerHTML='';

    charges.forEach((charge,index) => {
      const row=document.createElement('div');
      row.className='quote-charge-row';

      row.innerHTML=`
        <input data-field="charge_name" value="${escapeHtml(charge.charge_name)}" placeholder="Charge name">

        <select data-field="charge_category">
          ${['labour','installation','delivery','transport','measurement','design','subcontractor','waste','overhead','consumables','machine','disposal','parking_toll','other']
            .map(v=>`<option value="${v}" ${charge.charge_category===v?'selected':''}>${v.replace('_',' ')}</option>`)
            .join('')}
        </select>

        <select data-field="calculation_type">
          <option value="fixed" ${charge.calculation_type==='fixed'?'selected':''}>Fixed</option>
          <option value="percentage" ${charge.calculation_type==='percentage'?'selected':''}>Percentage</option>
        </select>

        <input data-field="rate" type="number" min="0" step=".01" value="${charge.rate}" placeholder="Rate">

        <label class="quote-visible-toggle">
          <input data-field="internal_only" type="checkbox" ${charge.internal_only?'checked':''}>
          Internal
        </label>

        <button type="button" class="btn danger" data-remove="${index}">×</button>
      `;

      row.querySelectorAll('[data-field]').forEach(input => {
        input.addEventListener('input', e => {
          const field=e.target.dataset.field;
          let value=e.target.type==='checkbox' ? e.target.checked : e.target.value;

          if(field==='rate') value=Number(value||0);

          charges[index][field]=value;
          calculate();
        });
      });

      row.querySelector('[data-remove]').addEventListener('click',()=>{
        charges.splice(index,1);
        renderCharges();
      });

      wrap.appendChild(row);
    });

    calculate();
  }

  function escapeHtml(value){
    return String(value??'')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'","&#039;");
  }

  function calculate() {
    items.forEach(item => {
      item.amount = Number(item.quantity || 0) * Number(item.unit_price || 0);
      item.internal_total_cost = Number(item.quantity || 0) * Number(item.internal_unit_cost || 0);
    });

    const itemInternalCost = items.reduce((sum,i)=>sum+Number(i.internal_total_cost||0),0);
    const customerLineTotal = items.reduce((sum,i)=>sum+Number(i.amount||0),0);

    let externalChargeTotal=0;
    let internalChargeTotal=0;
    let wasteCost=0;

    charges.forEach(charge => {
      const base = charge.calculation_type==='percentage'
        ? (canViewCost ? itemInternalCost : customerLineTotal)
        : 0;

      charge.base_amount=base;
      charge.amount = charge.calculation_type==='percentage'
        ? base * (Number(charge.rate||0)/100)
        : Number(charge.rate||0);

      if(charge.charge_category==='waste') wasteCost += charge.amount;

      if(charge.internal_only){
        internalChargeTotal += charge.amount;
      }else{
        externalChargeTotal += charge.amount;
      }
    });

    let directCost = itemInternalCost;
    if(!canViewCost) directCost = 0;

    const overheadPct = Number($('quoteOverheadPct')?.value || 0);
    const overheadAmount = directCost * overheadPct / 100;
    const internalCost = directCost + internalChargeTotal + wasteCost + overheadAmount;

    const markupType = $('quoteMarkupType')?.value || 'percentage';
    const markupValue = Number($('quoteMarkupValue')?.value || 0);

    let markupAmount = 0;
    let calculatedSelling = customerLineTotal + externalChargeTotal;

    if(canViewCost){
      if(markupType==='percentage'){
        markupAmount = internalCost * markupValue / 100;
        calculatedSelling = internalCost + markupAmount;
      }else if(markupType==='fixed'){
        markupAmount = markupValue;
        calculatedSelling = internalCost + markupAmount;
      }else if(markupType==='margin'){
        const margin = Math.min(99.99,Math.max(0,markupValue)) / 100;
        calculatedSelling = margin < 1 ? internalCost / (1-margin) : internalCost;
        markupAmount = calculatedSelling - internalCost;
      }

      calculatedSelling = Math.max(calculatedSelling, customerLineTotal + externalChargeTotal);
    }

    const discountType = $('quoteDiscountType')?.value || 'none';
    const discountValue = Number($('quoteDiscountValue')?.value || 0);
    let discountAmount=0;

    if(discountType==='percentage'){
      discountAmount=calculatedSelling*discountValue/100;
    }else if(discountType==='fixed'){
      discountAmount=discountValue;
    }

    discountAmount=Math.min(discountAmount,calculatedSelling);

    const subtotal=Math.max(0,calculatedSelling-discountAmount);
    const taxPct=Number($('quoteTaxPct')?.value||0);
    const taxAmount=subtotal*taxPct/100;
    const finalTotal=subtotal+taxAmount;

    if($('summaryDirectCost')) $('summaryDirectCost').textContent=money(directCost);
    if($('summaryWasteCost')) $('summaryWasteCost').textContent=money(wasteCost);
    if($('summaryOverhead')) $('summaryOverhead').textContent=money(overheadAmount);
    if($('summaryInternalCost')) $('summaryInternalCost').textContent=money(internalCost);
    if($('summaryMarkup')) $('summaryMarkup').textContent=money(markupAmount);

    $('summarySelling').textContent=money(calculatedSelling);
    $('summaryDiscount').textContent='- '+money(discountAmount);
    $('summarySubtotal').textContent=money(subtotal);
    $('summaryTax').textContent=money(taxAmount);
    $('summaryFinal').textContent=money(finalTotal);

    return {
      direct_cost: directCost,
      waste_cost: wasteCost,
      overhead_amount: overheadAmount,
      internal_cost: internalCost,
      markup_type: markupType,
      markup_value: markupValue,
      markup_amount: markupAmount,
      selling_price_before_discount: calculatedSelling,
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: discountAmount,
      subtotal,
      tax_percent: taxPct,
      tax_amount: taxAmount,
      final_total: finalTotal
    };
  }

  function useDesign() {
    const select=$('quoteDesign');
    const option=select.options[select.selectedIndex];
    if(!select.value) return;

    // CRM/customer snapshots now come from Stage 2 context and should not be
    // silently replaced by older design snapshot data.
    if(!$('quoteCustomerId')?.value){
      $('quoteCustomerName').value=option.dataset.customer||'';
      $('quoteCustomerEmail').value=option.dataset.email||'';
      $('quoteCustomerPhone').value=option.dataset.phone||'';
    }

    if(option.dataset.room && !$('quoteProjectType')?.value){
      $('quoteProjectType').value=option.dataset.room;
    }

    if(option.dataset.price && Number(option.dataset.price)>0 && items.length===0){
      addItem({
        item_type:'cabinet',
        description:'Cabinet system based on '+(option.dataset.code||'saved design'),
        quantity:1,
        unit:'job',
        unit_price:Number(option.dataset.price),
        internal_unit_cost:0
      });
    }
  }

  function useMaterialCalculation() {
    const select=$('quoteMaterialCalc');
    const option=select.options[select.selectedIndex];
    if(!select.value) return;

    const cost=Number(option.dataset.total||0);

    if(option.dataset.customer && !$('quoteCustomerName').value){
      $('quoteCustomerName').value=option.dataset.customer;
    }

    const existing=items.find(i=>i.notes==='material_calculation_reference');

    if(existing){
      existing.internal_unit_cost=cost;
    }else{
      items.push({
        item_type:'material',
        description:'Cabinet materials',
        quantity:1,
        unit:'job',
        unit_price:0,
        internal_unit_cost:cost,
        show_on_customer_quote:false,
        notes:'material_calculation_reference'
      });
    }

    renderItems();
  }


  function clearInvalidSourceReferences() {
    if(!$('quoteMaterialCalc')?.value){
      const before=items.length;
      items=items.filter(item=>item.notes!=='material_calculation_reference');
      if(items.length!==before) renderItems();
    }
  }

  function payload() {
    const totals=calculate();
    const designSelect=$('quoteDesign');
    const designOption=designSelect?.options[designSelect.selectedIndex];

    return {
      customer_id: $('quoteCustomerId')?.value || null,
      project_id: $('quoteProjectId')?.value || null,
      site_measurement_id: $('quoteMeasurementId')?.value || null,
      salesperson_id: $('quoteSalespersonId')?.value || null,

      design_id: designSelect?.value || null,
      design_code: designOption?.dataset.code || '',
      material_calculation_id: $('quoteMaterialCalc')?.value || null,

      customer_name: $('quoteCustomerName').value.trim(),
      customer_email: $('quoteCustomerEmail').value.trim(),
      customer_phone: $('quoteCustomerPhone').value.trim(),
      customer_billing_address_snapshot: $('quoteCustomerBillingAddress')?.value.trim() || '',
      customer_site_address_snapshot: $('quoteCustomerSiteAddress')?.value.trim() || '',

      project_name: $('quoteProjectName').value.trim(),
      project_type: $('quoteProjectType').value.trim(),
      site_address_snapshot: $('quoteSiteAddress')?.value.trim() || '',

      quotation_title: $('quoteTitle')?.value.trim() || '',
      reference_no: $('quoteReferenceNo')?.value.trim() || '',
      quotation_date: $('quoteDate').value,
      valid_until: $('quoteValidUntil').value,

      ...totals,

      tax_name: $('quoteTaxName').value.trim(),
      internal_notes: $('quoteInternalNotes').value.trim(),
      customer_notes: $('quoteCustomerNotes').value.trim(),
      terms_and_conditions: $('quoteTerms').value.trim(),

      items,
      charges
    };
  }

  $('addQuoteItemBtn').addEventListener('click',()=>addItem());
  $('addChargeBtn').addEventListener('click',()=>addCharge());

  document.querySelectorAll('[data-preset]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      try{ addCharge(JSON.parse(btn.dataset.preset)); }catch(e){}
    });
  });

  $('quoteDesign')?.addEventListener('change',useDesign);
  $('quoteMaterialCalc')?.addEventListener('change',useMaterialCalculation);
  $('quoteCustomerId')?.addEventListener('change',clearInvalidSourceReferences);
  $('quoteProjectId')?.addEventListener('change',clearInvalidSourceReferences);

  [
    'quoteOverheadPct',
    'quoteMarkupType',
    'quoteMarkupValue',
    'quoteDiscountType',
    'quoteDiscountValue',
    'quoteTaxPct'
  ].forEach(id=>{
    $(id)?.addEventListener('input',calculate);
    $(id)?.addEventListener('change',calculate);
  });

  $('saveQuoteForm').addEventListener('submit',e=>{
    const p=payload();

    if(!p.customer_id){
      e.preventDefault();
      window.IdeaREAlert
        ? IdeaREAlert.warning('CRM customer required','Choose a customer from CRM before saving the quotation.')
        : alert('Choose a customer from CRM before saving the quotation.');
      $('quoteCustomerId')?.focus();
      return;
    }

    if(!p.customer_name){
      e.preventDefault();
      window.IdeaREAlert
        ? IdeaREAlert.warning('Customer name required','Enter the customer name that should appear on this quotation.')
        : alert('Enter the customer name before saving.');
      return;
    }

    if(!p.items.length && !p.charges.length){
      e.preventDefault();
      window.IdeaREAlert
        ? IdeaREAlert.warning('Quotation is empty','Add at least one quotation item or charge.')
        : alert('Add at least one quotation item or charge.');
      return;
    }

    $('quotePayload').value=JSON.stringify(p);
  });

  addItem({
    item_type:'cabinet',
    description:'Cabinet works',
    quantity:1,
    unit:'job',
    unit_price:0,
    internal_unit_cost:0
  });

  calculate();
})();
