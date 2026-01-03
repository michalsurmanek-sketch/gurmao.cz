// Toast Notification System for GURMAO.cz
// © 2025 GURMAO.cz

class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.init();
  }

  init() {
    // Create container if it doesn't exist
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 3000) {
    const id = Date.now() + Math.random();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add spinner for loading type
    if (type === 'loading') {
      const spinner = document.createElement('span');
      spinner.className = 'toast-spinner';
      toast.appendChild(spinner);
    }
    
    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);
    
    this.container.appendChild(toast);
    this.toasts.set(id, toast);
    
    // Auto-dismiss (except loading toasts)
    if (type !== 'loading' && duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
    
    return id;
  }

  dismiss(id) {
    const toast = this.toasts.get(id);
    if (!toast) return;
    
    toast.classList.add('toast-exit');
    setTimeout(() => {
      toast.remove();
      this.toasts.delete(id);
    }, 300);
  }

  dismissAll() {
    this.toasts.forEach((_, id) => this.dismiss(id));
  }

  // Convenience methods
  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 4000) {
    return this.show(message, 'error', duration);
  }

  info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }

  loading(message) {
    return this.show(message, 'loading', 0);
  }

  // Update loading toast to success/error
  update(id, message, type = 'success') {
    const toast = this.toasts.get(id);
    if (!toast) return;
    
    // Remove spinner if exists
    const spinner = toast.querySelector('.toast-spinner');
    if (spinner) spinner.remove();
    
    // Update class and text
    toast.className = `toast toast-${type}`;
    const text = toast.querySelector('span');
    if (text) text.textContent = message;
    
    // Auto-dismiss
    setTimeout(() => this.dismiss(id), 3000);
  }
}

// Global instance
window.toast = new ToastManager();

// Wrapper functions for convenience
window.showToast = (message, type, duration) => window.toast.show(message, type, duration);
window.toastSuccess = (message) => window.toast.success(message);
window.toastError = (message) => window.toast.error(message);
window.toastInfo = (message) => window.toast.info(message);
window.toastLoading = (message) => window.toast.loading(message);
