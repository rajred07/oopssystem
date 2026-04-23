/**
 * Toast — Static notification utility.
 * Displays ephemeral messages that auto-dismiss after 3.5s.
 */
class Toast {
  static show(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Icon prefix
    const icons = { success: '✓', error: '✕', warning: '⚠' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || '✓'}</span><span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(120%)';
      setTimeout(() => toast.remove(), 350);
    }, 3500);
  }
}
