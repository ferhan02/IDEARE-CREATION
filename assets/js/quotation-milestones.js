(() => {
  const $ = id => document.getElementById(id);
  const form = $('saveQuoteForm');
  const wrap = $('quoteMilestoneRows');
  if (!form || !wrap) return;

  let seq = 0;
  let milestones = [];
  const uid = () => `pm_${Date.now().toString(36)}_${(++seq).toString(36)}`;
  const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const round = value => Math.round((n(value) + Number.EPSILON) * 100) / 100;
  const money = value => new Intl.NumberFormat('en-MY', {style:'currency',currency:'MYR'}).format(n(value));
  const escapeHtml = value => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function quotationTotal(){
    const text = String($('summaryFinal')?.textContent || '0');
    return round(Number(text.replace(/[^0-9.-]+/g,'')) || 0);
  }

  function milestoneAmount(row,total){
    return row.calculation_type === 'percentage'
      ? round(total * n(row.value) / 100)
      : round(row.value);
  }

  function dueLabel(trigger){
    return {
      acceptance:'On acceptance',
      before_production:'Before production',
      before_delivery:'Before delivery',
      on_installation:'On installation',
      on_completion:'On completion',
      date:'Specific date',
      other:'Other / manually agreed'
    }[trigger] || 'Other / manually agreed';
  }

  function make(data={}){
    return {
      client_key:data.client_key || uid(),
      label:data.label || 'Deposit',
      calculation_type:data.calculation_type || 'percentage',
      value:n(data.value ?? 0),
      due_trigger:data.due_trigger || 'acceptance',
      due_date:data.due_date || '',
      customer_visible:data.customer_visible ?? true,
      notes:data.notes || ''
    };
  }

  function updateTotals(){
    const total = quotationTotal();
    let scheduled = 0;
    milestones.forEach(row => { scheduled += milestoneAmount(row,total); });
    scheduled = round(scheduled);
    const difference = round(total - scheduled);

    if ($('quoteMilestoneTotal')) $('quoteMilestoneTotal').textContent = money(scheduled);
    if ($('quoteMilestoneBalance')) {
      $('quoteMilestoneBalance').textContent = money(difference);
      $('quoteMilestoneBalance').classList.toggle('is-balanced', milestones.length > 0 && Math.abs(difference) <= 0.05);
      $('quoteMilestoneBalance').classList.toggle('is-unbalanced', milestones.length > 0 && Math.abs(difference) > 0.05);
    }

    wrap.querySelectorAll('[data-milestone-amount]').forEach((el,index) => {
      el.textContent = money(milestoneAmount(milestones[index] || {}, total));
    });
  }

  function render(){
    wrap.innerHTML = '';

    milestones.forEach((row,index) => {
      const el = document.createElement('div');
      el.className = 'quote-payment-row';
      el.innerHTML = `
        <div>
          <input data-field="label" value="${escapeHtml(row.label)}" placeholder="Deposit / Progress claim / Balance">
          <input data-field="notes" value="${escapeHtml(row.notes)}" placeholder="Optional customer note">
        </div>
        <div class="quote-payment-calc">
          <select data-field="calculation_type">
            <option value="percentage" ${row.calculation_type==='percentage'?'selected':''}>Percentage</option>
            <option value="fixed" ${row.calculation_type==='fixed'?'selected':''}>Fixed RM</option>
          </select>
          <input data-field="value" type="number" min="0" step=".01" value="${row.value}" aria-label="Payment milestone value">
        </div>
        <div>
          <select data-field="due_trigger">
            ${['acceptance','before_production','before_delivery','on_installation','on_completion','date','other']
              .map(v=>`<option value="${v}" ${row.due_trigger===v?'selected':''}>${dueLabel(v)}</option>`).join('')}
          </select>
          <input data-field="due_date" type="date" value="${escapeHtml(row.due_date)}" ${row.due_trigger==='date'?'':'hidden'}>
        </div>
        <strong data-milestone-amount>${money(milestoneAmount(row,quotationTotal()))}</strong>
        <label class="check quote-payment-visible"><input data-field="customer_visible" type="checkbox" ${row.customer_visible?'checked':''}> Show</label>
        <button class="btn danger" type="button" data-remove aria-label="Remove payment milestone">×</button>
      `;

      el.querySelectorAll('[data-field]').forEach(input => {
        const event = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
        input.addEventListener(event, e => {
          const field = e.target.dataset.field;
          let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
          if (field === 'value') value = n(value);
          row[field] = value;
          if (field === 'due_trigger') render();
          else updateTotals();
        });
      });

      el.querySelector('[data-remove]').addEventListener('click', async () => {
        let confirmed = true;
        if (window.IdeaREAlert) {
          const result = await IdeaREAlert.confirm({
            title:'Remove payment milestone?',
            text:'This payment stage will be removed from the quotation schedule.',
            confirmText:'Remove',
            cancelText:'Cancel',
            danger:true
          });
          confirmed = !!result.isConfirmed;
        }
        if (confirmed) {
          milestones.splice(index,1);
          render();
        }
      });

      wrap.appendChild(el);
    });

    if (!milestones.length) {
      const empty = document.createElement('div');
      empty.className = 'quote-payment-empty';
      empty.innerHTML = '<strong>No payment schedule yet</strong><span>Add milestones or use a quick schedule. If left empty, Stage 5 can still create a single full-value invoice after acceptance.</span>';
      wrap.appendChild(empty);
    }

    updateTotals();
  }

  function applyPreset(name){
    if (name === '50-40-10') {
      milestones = [
        make({label:'Deposit',value:50,due_trigger:'acceptance'}),
        make({label:'Progress payment',value:40,due_trigger:'before_delivery'}),
        make({label:'Final balance',value:10,due_trigger:'on_completion'})
      ];
    } else if (name === '40-40-20') {
      milestones = [
        make({label:'Deposit',value:40,due_trigger:'acceptance'}),
        make({label:'Production payment',value:40,due_trigger:'before_production'}),
        make({label:'Final balance',value:20,due_trigger:'on_completion'})
      ];
    } else if (name === '100') {
      milestones = [make({label:'Full payment',value:100,due_trigger:'acceptance'})];
    }
    render();
  }

  $('addPaymentMilestoneBtn')?.addEventListener('click',() => {
    milestones.push(make({label:`Payment ${milestones.length + 1}`,value:0,due_trigger:'other'}));
    render();
  });

  document.querySelectorAll('[data-payment-preset]').forEach(button => {
    button.addEventListener('click',() => applyPreset(button.dataset.paymentPreset || ''));
  });

  // Keep RM previews in sync after Stage 3 recalculates quotation totals.
  document.addEventListener('input',() => setTimeout(updateTotals,0));
  document.addEventListener('change',() => setTimeout(updateTotals,0));

  // quotation-builder.js runs first and writes the authoritative browser payload.
  // Stage 5 appends the schedule, while PHP recalculates the amounts again.
  form.addEventListener('submit',event => {
    if (!milestones.length) return;

    const total = quotationTotal();
    const prepared = milestones.map((row,index) => ({
      label:String(row.label || '').trim(),
      calculation_type:row.calculation_type,
      value:n(row.value),
      amount:milestoneAmount(row,total),
      due_trigger:row.due_trigger,
      due_date:row.due_trigger === 'date' ? row.due_date : '',
      customer_visible:!!row.customer_visible,
      notes:String(row.notes || '').trim(),
      sort_order:index + 1
    })).filter(row => row.label);

    if (prepared.some(row => row.due_trigger === 'date' && !row.due_date)) {
      event.preventDefault();
      window.IdeaREAlert
        ? IdeaREAlert.warning('Payment date required','Choose a date for each milestone using “Specific date”.')
        : alert('Choose a date for each milestone using “Specific date”.');
      return;
    }

    const scheduled = round(prepared.reduce((sum,row)=>sum+n(row.amount),0));
    if (Math.abs(round(total - scheduled)) > 0.05) {
      event.preventDefault();
      const message = `Payment milestones total ${money(scheduled)} while the quotation total is ${money(total)}.`;
      window.IdeaREAlert
        ? IdeaREAlert.warning('Payment schedule does not balance',message)
        : alert(message);
      return;
    }

    const payloadInput = $('quotePayload');
    if (!payloadInput?.value) return;
    try {
      const payload = JSON.parse(payloadInput.value);
      payload.payment_milestones = prepared;
      payloadInput.value = JSON.stringify(payload);
    } catch (error) {
      event.preventDefault();
      window.IdeaREAlert
        ? IdeaREAlert.warning('Could not save payment schedule','Refresh the page and try again.')
        : alert('Could not save payment schedule. Refresh the page and try again.');
    }
  });

  render();
})();
