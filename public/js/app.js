/* ═══════════════════════════════════════════════════════════════
   app.js — Main application controller
   ═══════════════════════════════════════════════════════════════ */

const App = (() => {
  const sections = {
    upload: 'uploadSection',
    loading: 'loadingSection',
    dashboard: 'dashboardSection',
    error: 'errorSection',
  };

  function init() {
    // Initialize Lucide icons
    lucide.createIcons();

    // Initialize upload module
    Upload.init();

    // New Analysis button
    document.getElementById('btnNewAnalysis')?.addEventListener('click', resetToUpload);

    // Retry button (on error screen)
    document.getElementById('btnRetry')?.addEventListener('click', resetToUpload);
  }

  /**
   * Show one section, hide all others.
   * @param {'upload' | 'loading' | 'dashboard' | 'error'} viewName
   */
  function showView(viewName) {
    Object.entries(sections).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el) el.style.display = key === viewName ? '' : 'none';
    });

    // Show/hide "New Analysis" button
    const newBtn = document.getElementById('btnNewAnalysis');
    if (newBtn) {
      newBtn.style.display = (viewName === 'dashboard' || viewName === 'error') ? '' : 'none';
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Reinit Lucide
    lucide.createIcons();
  }

  function resetToUpload() {
    showView('upload');
    Upload.clearFile();
    ChartManager.destroy();

    // Reset form
    document.getElementById('analyzeForm')?.reset();

    // Reset loading bar
    const loadingBar = document.getElementById('loadingBar');
    if (loadingBar) loadingBar.style.width = '0%';
  }

  /**
   * Show a quick toast-style error (for validation, etc.)
   * For major errors, use showView('error') instead.
   */
  function showError(message) {
    // Simple: use the error section for now
    const msgEl = document.getElementById('errorMessage');
    if (msgEl) msgEl.textContent = message;
    showView('error');
  }

  // Boot the app
  document.addEventListener('DOMContentLoaded', () => {
    init();
    // Initialize auth state (navbar user pill / login links)
    if (typeof initNavAuth === 'function') initNavAuth();
  });

  return { showView, showError };
})();
