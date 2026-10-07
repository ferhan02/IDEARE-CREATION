(() => {
  if (typeof Swal === 'undefined') return;

  const base = {
    buttonsStyling: false,
    reverseButtons: true,
    focusCancel: false,
    heightAuto: false,
    showClass: {
      popup: 'ideare-swal-in'
    },
    hideClass: {
      popup: 'ideare-swal-out'
    },
    customClass: {
      popup: 'ideare-swal',
      title: 'ideare-swal-title',
      htmlContainer: 'ideare-swal-text',
      actions: 'ideare-swal-actions',
      confirmButton: 'ideare-swal-confirm',
      cancelButton: 'ideare-swal-cancel',
      icon: 'ideare-swal-icon'
    }
  };

  function toneClass(type) {
    if (type === 'success') return 'ideare-swal-success';
    if (type === 'error') return 'ideare-swal-error';
    if (type === 'warning') return 'ideare-swal-warning';
    if (type === 'info') return 'ideare-swal-info';
    return '';
  }

  async function fire(options = {}) {
    const type = options.icon || 'info';
    const singleAction = !options.showCancelButton;

    return Swal.fire({
      ...base,
      ...options,
      customClass: {
        ...base.customClass,
        ...(options.customClass || {}),
        popup: [
          base.customClass.popup,
          toneClass(type),
          singleAction ? 'ideare-swal-single-action' : 'ideare-swal-dialog',
          options.customClass?.popup || ''
        ].filter(Boolean).join(' ')
      }
    });
  }

  window.IdeaREAlert = {
    success(title, text = '') {
      return fire({
        icon: 'success',
        title,
        text,
        confirmButtonText: 'Done'
      });
    },

    error(title, text = '') {
      return fire({
        icon: 'error',
        title,
        text,
        confirmButtonText: 'Back'
      });
    },

    info(title, text = '') {
      return fire({
        icon: 'info',
        title,
        text,
        confirmButtonText: 'Okay'
      });
    },

    warning(title, text = '') {
      return fire({
        icon: 'warning',
        title,
        text,
        confirmButtonText: 'Okay'
      });
    },

    confirm({
      title = 'Are you sure?',
      text = '',
      confirmText = 'Continue',
      cancelText = 'Cancel',
      danger = false,
      icon = 'warning'
    } = {}) {
      return fire({
        icon,
        title,
        text,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        customClass: {
          confirmButton: danger
            ? 'ideare-swal-confirm ideare-swal-danger'
            : 'ideare-swal-confirm'
        }
      });
    }
  };

  document.querySelectorAll('[data-ideare-flash]').forEach(el => {
    const type = el.dataset.flashType || 'info';
    const message = el.dataset.flashMessage || el.textContent.trim();

    el.style.display = 'none';

    if (!message) return;

    if (type === 'success') {
      IdeaREAlert.success('Done', message);
    } else if (type === 'error') {
      IdeaREAlert.error('Something went wrong', message);
    } else if (type === 'warning') {
      IdeaREAlert.warning('Notice', message);
    } else {
      IdeaREAlert.info('Notice', message);
    }
  });
})();
