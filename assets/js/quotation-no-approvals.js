/* Presentation bridge for the no-internal-approval quotation policy.
 * SQL is authoritative; this removes obsolete workflow controls and wording.
 * Customer ACCEPTANCE is unaffected and still must be recorded explicitly. */
(() => {
  const readyLabel = 'Ready to issue';
  function changeText(selector, oldText, newText) {
    document.querySelectorAll(selector).forEach(node => {
      if (node.textContent.trim() === oldText) node.textContent = newText;
    });
  }
  document.querySelectorAll('a[href]').forEach(link => {
    if (/\/(approvals|quotation-approval-rules)\.php(?:[?#]|$)/.test(link.getAttribute('href'))) link.remove();
  });
  document.querySelectorAll('.quotation-kpi-card').forEach(card => {
    if (card.querySelector('span')?.textContent.trim() === 'Awaiting approval') card.remove();
  });
  document.querySelectorAll('.quotation-attention-panel').forEach(card => {
    if (card.querySelector('h2')?.textContent.trim() === 'Pending approvals') card.remove();
  });
  document.querySelectorAll('.workflow-approval-mini-list,.quote-workflow-settings').forEach(node => node.remove());
  document.querySelectorAll('.quotation-workflow-steps .workflow-step').forEach(step => {
    const label = step.querySelector('span');
    if (label?.textContent.trim() === 'Approval') { step.remove(); return; }
    if (label?.textContent.trim() === 'Approved') label.textContent = readyLabel;
  });
  document.querySelectorAll('.quotation-workflow-steps .workflow-step').forEach((step, i) => {
    const num = step.querySelector('b');
    if (num) num.textContent = String(i + 1);
  });
  changeText('.quotation-create-progress span', 'Revisions & approval', 'Versions & issue');
  document.querySelectorAll('.quotation-create-progress span').forEach(el => {
    if (el.textContent.includes('Revisions & approval')) {
      el.innerHTML = '<b>4</b> Versions &amp; issue';
    }
  });
  document.querySelectorAll('.quotation-workflow-head .muted').forEach(el => {
    el.textContent = 'Every submitted revision is frozen and can be issued directly. Customer acceptance is recorded separately.';
  });
  document.querySelectorAll('.quotation-revise-page .page-head .muted').forEach(el => {
    el.textContent = 'Changes remain a working draft until you submit the revision for issue. No management approval is required.';
  });
  document.querySelectorAll('.quote-payment-panel .muted').forEach(el => {
    if (el.textContent.includes('before approval'))
      el.textContent = 'Optional payment milestones are saved with each issued revision and can create invoices after acceptance.';
  });
  document.querySelectorAll('.quotation-workflow-panel .workflow-success-card strong').forEach(el => {
    el.textContent = el.textContent.replace('is approved', 'is ready to issue');
  });
  document.querySelectorAll('.quotation-workflow-panel .workflow-action-card').forEach(card => {
    card.querySelectorAll('span').forEach(el => {
      if (el.textContent.includes('approval is active')) el.textContent = 'The quotation is ready to return to draft and resubmit.';
    });
  });
  changeText('.quote-status', 'Approved', readyLabel);
  document.querySelectorAll('option[value="pending_approval"]').forEach(el => el.remove());
  document.querySelectorAll('option[value="approved"]').forEach(el => { el.textContent = readyLabel; });
  document.querySelectorAll('.quotation-centre-page .quotation-kpi-card small').forEach(el => {
    el.textContent = el.textContent.replace('Approved or sent', 'Ready to issue or sent');
  });
  document.querySelectorAll('.quotation-revise-page .page-head .muted').forEach(el => {
    el.textContent = el.textContent.replace('approval workflow', 'issue workflow');
  });
  document.querySelectorAll('.quotation-workflow-panel .workflow-step span').forEach(el => {
    el.textContent = el.textContent.replace('Approved', readyLabel);
  });
  document.querySelectorAll('.quotation-settings-page .quote-workflow-settings').forEach(el => el.remove());
  document.querySelectorAll('.quotation-settings-page .page-head .muted').forEach(el => {
    el.textContent = 'Pricing defaults and reusable charges. Quotation approval rules have been retired.';
  });
})();
