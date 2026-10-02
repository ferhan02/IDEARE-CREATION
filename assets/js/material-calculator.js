(() => {
  const $ = id => document.getElementById(id);
  if (!$('materialSelect')) return;

  const materials = window.IDEARE_MATERIALS || [];
  const sizes = window.IDEARE_MATERIAL_SIZES || [];

  let items = [];
  let partDraft = [];

  const money = value =>
    new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(Number(value || 0));

  function currentMaterial() {
    return materials.find(
      m => String(m.id) === String($('materialSelect').value)
    );
  }

  function currentSize() {
    return sizes.find(
      s => String(s.id) === String($('materialSize').value)
    );
  }

  function renderSizes() {
    const material = currentMaterial();
    const list = sizes.filter(
      s => String(s.material_id) === String(material?.id)
    );

    $('materialSize').innerHTML =
      '<option value="">Default / not applicable</option>' +
      list.map(s => `
        <option value="${s.id}">
          ${s.size_name || `${s.width_mm} × ${s.length_mm} mm`}
          — ${money(s.unit_cost)}
        </option>
      `).join('');

    $('materialSize').disabled = list.length === 0;

    $('materialUnitCost').value =
      Number(material?.default_unit_cost || 0).toFixed(2);

    $('materialWaste').value =
      Number(material?.default_waste_percent || 0).toFixed(2);

    updateSheetEditor();
  }

  function updateSheetEditor() {
    const material = currentMaterial();
    const isSheet = material?.unit_type === 'sheet';

    $('sheetPartEditor').hidden = !isSheet;

    if (!isSheet) {
      partDraft = [];
      renderParts();
    }
  }

  function addPart() {
    partDraft.push({
      part_name: 'Panel',
      width_mm: 600,
      length_mm: 850,
      quantity: 1,
      grain_direction: 'none',
      edge_band_top: false,
      edge_band_bottom: false,
      edge_band_left: false,
      edge_band_right: false,
      notes: ''
    });

    renderParts();
  }

  function renderParts() {
    $('partRows').innerHTML = '';

    partDraft.forEach((part, index) => {
      const row = document.createElement('div');
      row.className = 'part-row';

      row.innerHTML = `
        <input data-field="part_name" value="${part.part_name}" placeholder="Part name">
        <input data-field="width_mm" type="number" min="1" step="1" value="${part.width_mm}" placeholder="Width">
        <input data-field="length_mm" type="number" min="1" step="1" value="${part.length_mm}" placeholder="Length">
        <input data-field="quantity" type="number" min="1" step="1" value="${part.quantity}" placeholder="Qty">

        <select data-field="grain_direction">
          <option value="none" ${part.grain_direction==='none'?'selected':''}>No grain</option>
          <option value="length" ${part.grain_direction==='length'?'selected':''}>Length grain</option>
          <option value="width" ${part.grain_direction==='width'?'selected':''}>Width grain</option>
        </select>

        <button type="button" class="btn danger" data-remove="${index}">×</button>
      `;

      row.querySelectorAll('[data-field]').forEach(input => {
        input.addEventListener('input', e => {
          const field = e.target.dataset.field;
          let value = e.target.value;

          if (['width_mm','length_mm','quantity'].includes(field)) {
            value = Number(value || 0);
          }

          partDraft[index][field] = value;
          updateSheetEstimate();
        });
      });

      row.querySelector('[data-remove]').addEventListener('click', () => {
        partDraft.splice(index,1);
        renderParts();
        updateSheetEstimate();
      });

      $('partRows').appendChild(row);
    });

    updateSheetEstimate();
  }

  function updateSheetEstimate() {
    const material = currentMaterial();
    const size = currentSize();

    if (!material || material.unit_type !== 'sheet') return;

    if (!size || !size.width_mm || !size.length_mm || partDraft.length === 0) {
      return;
    }

    const wastePct = Number($('materialWaste').value || 0);

    let requiredArea = 0;

    partDraft.forEach(p => {
      requiredArea +=
        Number(p.width_mm || 0) *
        Number(p.length_mm || 0) *
        Number(p.quantity || 0);
    });

    requiredArea = requiredArea / 1000000;

    const adjustedArea = requiredArea * (1 + wastePct / 100);
    const sheetArea =
      (Number(size.width_mm) * Number(size.length_mm)) / 1000000;

    if (sheetArea > 0) {
      $('materialQty').value = Math.max(
        1,
        Math.ceil(adjustedArea / sheetArea)
      );
    }
  }

  function addMaterial() {
    const material = currentMaterial();
    const size = currentSize();

    if (!material) return;

    const qty = Math.max(0, Number($('materialQty').value || 0));
    const unitCost = Math.max(0, Number($('materialUnitCost').value || 0));
    const wastePct = Math.max(0, Number($('materialWaste').value || 0));

    if (qty <= 0) {
      window.IdeaREAlert
        ? IdeaREAlert.warning('Quantity required', 'Enter a quantity greater than zero.')
        : alert('Enter a quantity greater than zero.');
      return;
    }

    const materialCost = qty * unitCost;
    const wasteCost =
      material.unit_type === 'sheet' && partDraft.length
        ? 0
        : materialCost * (wastePct / 100);

    const totalCost = materialCost + wasteCost;

    items.push({
      material_id: Number(material.id),
      material_size_id: size ? Number(size.id) : null,
      description: material.name,
      quantity: qty,
      unit_type: material.unit_type,
      unit_cost: unitCost,
      waste_percent: wastePct,
      material_cost: materialCost,
      waste_cost: wasteCost,
      total_cost: totalCost,
      notes: '',
      sheet_width_mm: size ? Number(size.width_mm || 0) : 0,
      sheet_length_mm: size ? Number(size.length_mm || 0) : 0,
      parts: JSON.parse(JSON.stringify(partDraft))
    });

    partDraft = [];
    renderParts();
    renderItems();
  }

  function renderItems() {
    const tbody = $('materialRows');
    tbody.innerHTML = '';

    if (!items.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-text">No materials added yet.</td>
        </tr>
      `;
    }

    items.forEach((item, index) => {
      const tr = document.createElement('tr');

      let extra = '';
      if (item.unit_type === 'sheet' && item.parts.length) {
        const partCount = item.parts.reduce(
          (sum,p) => sum + Number(p.quantity || 0),
          0
        );

        extra = `<small>${partCount} panel piece(s) entered</small>`;
      }

      tr.innerHTML = `
        <td>
          <b>${item.description}</b>
          ${extra}
        </td>
        <td>${item.quantity}</td>
        <td>${item.unit_type.replace('_',' ')}</td>
        <td>${money(item.material_cost)}</td>
        <td>${item.waste_percent.toFixed(2)}% · ${money(item.waste_cost)}</td>
        <td><b>${money(item.total_cost)}</b></td>
        <td>
          <button type="button" class="btn danger" data-remove="${index}">
            Remove
          </button>
        </td>
      `;

      tr.querySelector('[data-remove]').addEventListener('click', async () => {
        let confirmed = true;

        if (window.IdeaREAlert) {
          const result = await IdeaREAlert.confirm({
            title: 'Remove material?',
            text: 'This material will be removed from the current calculation.',
            confirmText: 'Remove',
            cancelText: 'Cancel',
            danger: true
          });

          confirmed = result.isConfirmed;
        }

        if (confirmed) {
          items.splice(index,1);
          renderItems();
        }
      });

      tbody.appendChild(tr);
    });

    const base = items.reduce(
      (sum,i) => sum + Number(i.material_cost || 0),
      0
    );

    const waste = items.reduce(
      (sum,i) => sum + Number(i.waste_cost || 0),
      0
    );

    $('materialSubtotal').textContent = money(base);
    $('wasteSubtotal').textContent = money(waste);
    $('materialGrandTotal').textContent = money(base+waste);
  }

  function buildPayload() {
    const designOption =
      $('designSelect').options[$('designSelect').selectedIndex];

    const base = items.reduce(
      (sum,i) => sum + Number(i.material_cost || 0),
      0
    );

    const waste = items.reduce(
      (sum,i) => sum + Number(i.waste_cost || 0),
      0
    );

    return {
      design_id: $('designSelect').value || null,
      design_code: designOption?.dataset.code || '',
      calculation_name: $('calcName').value.trim(),
      customer_name: $('calcCustomer').value.trim(),
      notes: $('calcNotes').value.trim(),
      total_material_cost: base,
      total_waste_cost: waste,
      total_cost: base + waste,
      items
    };
  }

  $('materialSelect').addEventListener('change', renderSizes);

  $('materialSize').addEventListener('change', () => {
    const size = currentSize();

    if (size && Number(size.unit_cost) > 0) {
      $('materialUnitCost').value =
        Number(size.unit_cost).toFixed(2);
    }

    updateSheetEstimate();
  });

  $('materialWaste').addEventListener('input', updateSheetEstimate);

  $('designSelect').addEventListener('change', () => {
    const option =
      $('designSelect').options[$('designSelect').selectedIndex];

    if (option?.dataset.customer) {
      $('calcCustomer').value = option.dataset.customer;
    }
  });

  $('addPartBtn').addEventListener('click', addPart);
  $('addMaterialBtn').addEventListener('click', addMaterial);

  $('clearMaterialsBtn').addEventListener('click', async () => {
    if (!items.length) return;

    let confirmed = true;

    if (window.IdeaREAlert) {
      const result = await IdeaREAlert.confirm({
        title: 'Clear calculation?',
        text: 'All unsaved material lines will be removed.',
        confirmText: 'Clear',
        cancelText: 'Cancel',
        danger: true
      });

      confirmed = result.isConfirmed;
    }

    if (confirmed) {
      items = [];
      renderItems();
    }
  });

  $('saveMaterialForm').addEventListener('submit', e => {
    if (!items.length) {
      e.preventDefault();

      window.IdeaREAlert
        ? IdeaREAlert.warning(
            'Nothing to save',
            'Add at least one material first.'
          )
        : alert('Add at least one material first.');

      return;
    }

    $('materialPayload').value =
      JSON.stringify(buildPayload());
  });

  renderSizes();
  addPart();
  renderItems();
})();
