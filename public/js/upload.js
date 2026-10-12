
const Upload = (() => {
  let selectedFile = null;

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const ALLOWED_EXT = ['.pdf', '.docx'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

  function init() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const removeFile = document.getElementById('removeFile');
    const form = document.getElementById('analyzeForm');

    if (!dropZone || !fileInput) return;

    // Browse button → trigger file input
    browseBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      fileInput.click();
    });

    // Click on drop zone → trigger file input
    dropZone.addEventListener('click', (e) => {
      if (e.target === browseBtn || e.target.closest('.drop-zone__browse')) return;
      fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files?.[0]) {
        handleFile(e.target.files[0]);
      }
    });

    // Drag-and-drop
    dropZone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dropZone.classList.add('drop-zone--active');
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drop-zone--active');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drop-zone--active');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drop-zone--active');
      if (e.dataTransfer.files?.[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    // Remove file
    removeFile?.addEventListener('click', () => {
      clearFile();
    });

    // Form submit
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      submitAnalysis();
    });
  }

  function handleFile(file) {
    // Validate type
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
      App.showError('Invalid file type. Please upload a PDF or DOCX file.');
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      App.showError('File too large. Maximum size is 5 MB.');
      return;
    }

    selectedFile = file;
    showFilePreview(file);
  }

  function showFilePreview(file) {
    const dropZone = document.getElementById('dropZone');
    const preview = document.getElementById('filePreview');
    const nameEl = document.getElementById('fileName');
    const sizeEl = document.getElementById('fileSize');

    if (dropZone) dropZone.style.display = 'none';
    if (preview) preview.style.display = 'flex';
    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = formatSize(file.size);

    lucide.createIcons();
  }

  function clearFile() {
    selectedFile = null;
    const dropZone = document.getElementById('dropZone');
    const preview = document.getElementById('filePreview');
    const fileInput = document.getElementById('fileInput');

    if (dropZone) dropZone.style.display = 'flex';
    if (preview) preview.style.display = 'none';
    if (fileInput) fileInput.value = '';
  }

  async function submitAnalysis() {
    if (!selectedFile) {
      App.showError('Please upload a resume file first.');
      return;
    }

    const targetRole = document.getElementById('targetRole')?.value?.trim();
    if (!targetRole) {
      App.showError('Please enter a target job role.');
      return;
    }

    const jobDescription = document.getElementById('jobDescription')?.value?.trim() || '';

    // Build FormData
    const formData = new FormData();
    formData.append('resume', selectedFile);
    formData.append('targetRole', targetRole);
    if (jobDescription) {
      formData.append('jobDescription', jobDescription);
    }

    // Show loading
    App.showView('loading');
    setSubmitLoading(true);
    startLoadingAnimation();

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server error (${response.status})`);
      }

      if (!result.success || !result.data) {
        throw new Error('Invalid response from server.');
      }

      // Render dashboard
      App.showView('dashboard');
      Dashboard.render(result.data, result.meta);
      ExportManager.init(result.data, result.meta);

      // If analysis was saved to DB, notify auth module
      if (result.meta?.savedId) {
        window.dispatchEvent(new CustomEvent('analysisSaved', {
          detail: { targetRole: result.meta.targetRole }
        }));
      }

    } catch (err) {
      App.showView('error');
      const msgEl = document.getElementById('errorMessage');
      if (msgEl) msgEl.textContent = err.message;
    } finally {
      setSubmitLoading(false);
    }
  }

  function setSubmitLoading(loading) {
    const btn = document.getElementById('submitBtn');
    const loader = document.getElementById('btnLoader');
    if (btn) btn.disabled = loading;
    if (loader) loader.style.display = loading ? 'flex' : 'none';
  }

  /** Animate loading text and progress bar. */
  function startLoadingAnimation() {
    const textEl = document.getElementById('loadingText');
    const barEl = document.getElementById('loadingBar');
    const messages = [
      'Extracting resume content...',
      'Analyzing skills and experience...',
      'Comparing with target role requirements...',
      'Building your personalized roadmap...',
      'Generating ATS optimization tips...',
      'Finalizing your career analysis...',
    ];

    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx >= messages.length) {
        clearInterval(interval);
        return;
      }
      if (textEl) textEl.textContent = messages[idx];
      if (barEl) barEl.style.width = `${Math.min(((idx + 1) / messages.length) * 100, 95)}%`;
    }, 2500);

    // Start progress bar
    if (barEl) barEl.style.width = '15%';
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return { init, clearFile };
})();
