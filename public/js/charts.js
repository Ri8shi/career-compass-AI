/* ═══════════════════════════════════════════════════════════════
   charts.js — Chart.js configurations (dark theme)
   ═══════════════════════════════════════════════════════════════ */

const ChartManager = (() => {
  let radarChart = null;

  const COLORS = {
    primary: '#2563eb',
    primaryLight: '#3b82f6',
    secondary: '#1e40af',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#2563eb',
    gridLine: 'rgba(0, 0, 0, 0.06)',
    text: '#475569',
  };

  // Global defaults for light theme
  function applyDefaults() {
    Chart.defaults.color = COLORS.text;
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
    Chart.defaults.plugins.legend.labels.padding = 16;
  }

  /**
   * Create or update the radar/spider chart.
   * @param {string[]} labels  — Skill category labels
   * @param {number[]} current — Current skill scores (0-100)
   * @param {number[]} required — Required skill scores (0-100)
   */
  function createRadarChart(labels, current, required) {
    const canvas = document.getElementById('radarChart');
    if (!canvas) return;

    applyDefaults();

    if (radarChart) {
      radarChart.destroy();
    }

    const ctx = canvas.getContext('2d');

    radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'Your Profile',
            data: current,
            backgroundColor: 'rgba(37, 99, 235, 0.10)',
            borderColor: COLORS.primary,
            borderWidth: 2,
            pointBackgroundColor: COLORS.primary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Target Role',
            data: required,
            backgroundColor: 'rgba(5, 150, 105, 0.06)',
            borderColor: COLORS.success,
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: COLORS.success,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 25,
              display: false,
            },
            grid: {
              color: COLORS.gridLine,
            },
            angleLines: {
              color: COLORS.gridLine,
            },
            pointLabels: {
              color: COLORS.text,
              font: { size: 10, weight: '500' },
              padding: 8,
            },
          },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 10 },
              padding: 12,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#0f172a',
            bodyColor: '#475569',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            titleFont: { weight: '600' },
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%`,
            },
          },
        },
      },
    });
  }

  /**
   * Build radar chart data from analysis results.
   * @param {object} analysis — The full analysis response data
   */
  function renderFromAnalysis(analysis) {
    const subScores = analysis.subScores || {};
    const labels = ['Skills Match', 'Experience', 'Education', 'ATS Compat.'];
    const current = [
      subScores.skillsMatch || 0,
      subScores.experience || 0,
      subScores.education || 0,
      subScores.ats || 0,
    ];
    // Target is always 100 (the ideal)
    const required = [100, 100, 100, 100];

    createRadarChart(labels, current, required);
  }

  function destroy() {
    if (radarChart) {
      radarChart.destroy();
      radarChart = null;
    }
  }

  return { renderFromAnalysis, destroy };
})();
