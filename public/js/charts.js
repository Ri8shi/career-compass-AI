/* ═══════════════════════════════════════════════════════════════
   charts.js — Chart.js configurations (dark theme)
   ═══════════════════════════════════════════════════════════════ */

const ChartManager = (() => {
  let radarChart = null;

  const COLORS = {
    primary: '#6366f1',
    primaryLight: '#818cf8',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    gridLine: 'rgba(255, 255, 255, 0.06)',
    text: '#94a3b8',
  };

  function applyDarkDefaults() {
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

    applyDarkDefaults();

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
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            borderColor: COLORS.primary,
            borderWidth: 2,
            pointBackgroundColor: COLORS.primary,
            pointBorderColor: '#0a0a0f',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Target Role',
            data: required,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: COLORS.success,
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: COLORS.success,
            pointBorderColor: '#0a0a0f',
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
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
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
