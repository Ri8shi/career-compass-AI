/* ═══════════════════════════════════════════════════════════════
   dashboard.js — Renders the full analysis dashboard
   ═══════════════════════════════════════════════════════════════ */

const Dashboard = (() => {

  /**
   * Render the entire dashboard from analysis data.
   * @param {object} analysis — The analysis result from the API
   * @param {object} meta     — Meta info (targetRole, fileName, analysisTime, etc.)
   */
  function render(analysis, meta) {
    renderMeta(meta);
    renderSummary(analysis.summary);
    renderOverallScore(analysis.overallScore || 0);
    renderSubScores(analysis.subScores || {});
    renderMatchedSkills(analysis.matchedSkills || []);
    renderMissingSkills(analysis.missingSkills || []);
    renderBonusSkills(analysis.bonusSkills || []);
    renderRoadmap(analysis.roadmap || []);
    renderAtsTips(analysis.atsTips || []);
    renderCareerPaths(analysis.careerPaths || []);
    renderImprovements(analysis.resumeImprovements || []);

    // Charts
    ChartManager.renderFromAnalysis(analysis);

    // Re-init Lucide icons for newly rendered elements
    lucide.createIcons();
  }

  /* ─── Meta ─── */
  function renderMeta(meta) {
    const el = document.getElementById('dashMeta');
    if (el && meta) {
      el.textContent = `${meta.fileName || 'Resume'} → ${meta.targetRole || 'Role'} · ${meta.analysisTime || ''} · ${meta.model || ''}`;
    }
  }

  /* ─── Summary ─── */
  function renderSummary(summary) {
    const el = document.getElementById('summaryText');
    if (el) {
      el.textContent = summary || 'Analysis complete. Review your results below.';
    }
  }

  /* ─── Overall Score (animated circle) ─── */
  function renderOverallScore(score) {
    const valueEl = document.getElementById('overallScoreValue');
    const fillEl = document.getElementById('scoreCircleFill');
    const circleEl = document.getElementById('overallScoreCircle');

    if (!valueEl || !fillEl) return;

    // Add SVG gradient definition if it doesn't exist
    const svg = fillEl.closest('svg');
    if (svg && !svg.querySelector('#scoreGradient')) {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `
        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2563eb" />
          <stop offset="100%" style="stop-color:#3b82f6" />
        </linearGradient>
      `;
      svg.prepend(defs);
    }

    // Circumference = 2 * PI * r = 2 * 3.14159 * 52 ≈ 326.73
    const circumference = 326.73;
    const offset = circumference - (score / 100) * circumference;

    // Animate after a short delay
    setTimeout(() => {
      fillEl.style.strokeDashoffset = offset;
    }, 300);

    // Animate counter
    animateCounter(valueEl, 0, score, 1500);

    // Color the circle based on score
    if (circleEl) {
      if (score >= 75) circleEl.style.filter = 'drop-shadow(0 0 16px rgba(5, 150, 105, 0.25))';
      else if (score >= 50) circleEl.style.filter = 'drop-shadow(0 0 16px rgba(217, 119, 6, 0.25))';
      else circleEl.style.filter = 'drop-shadow(0 0 16px rgba(220, 38, 38, 0.25))';
    }
  }

  /* ─── Sub Scores (animated bars) ─── */
  function renderSubScores(subScores) {
    const mapping = [
      { bar: 'barSkills', val: 'valSkills', key: 'skillsMatch' },
      { bar: 'barExperience', val: 'valExperience', key: 'experience' },
      { bar: 'barEducation', val: 'valEducation', key: 'education' },
      { bar: 'barAts', val: 'valAts', key: 'ats' },
    ];

    mapping.forEach(({ bar, val, key }, i) => {
      const score = subScores[key] || 0;
      const barEl = document.getElementById(bar);
      const valEl = document.getElementById(val);

      if (barEl) {
        // Apply color based on score
        let color;
        if (score >= 75) color = 'linear-gradient(90deg, #059669, #34d399)';
        else if (score >= 50) color = 'linear-gradient(90deg, #d97706, #fbbf24)';
        else color = 'linear-gradient(90deg, #dc2626, #f87171)';

        barEl.style.background = color;
        setTimeout(() => {
          barEl.style.width = `${score}%`;
        }, 400 + i * 150);
      }

      if (valEl) {
        animateCounter(valEl, 0, score, 1200, 400 + i * 150);
      }
    });
  }

  /* ─── Matched Skills ─── */
  function renderMatchedSkills(skills) {
    const container = document.getElementById('matchedSkills');
    const countEl = document.getElementById('matchedCount');
    if (!container) return;

    container.innerHTML = '';
    if (countEl) countEl.textContent = skills.length;

    skills.forEach((skill, i) => {
      const tag = document.createElement('span');
      tag.className = `skill-tag skill-tag--matched stagger-${(i % 8) + 1}`;
      tag.innerHTML = `<i data-lucide="check" style="width:12px;height:12px;"></i> ${escHtml(skill)}`;
      container.appendChild(tag);
    });
  }

  /* ─── Missing Skills ─── */
  function renderMissingSkills(skills) {
    const container = document.getElementById('missingSkills');
    const countEl = document.getElementById('missingCount');
    if (!container) return;

    container.innerHTML = '';
    if (countEl) countEl.textContent = skills.length;

    skills.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = `missing-skill-item stagger-${(i % 8) + 1}`;

      const priority = (item.priority || 'medium').toLowerCase();
      div.innerHTML = `
        <span class="missing-skill-item__priority missing-skill-item__priority--${priority}">${priority}</span>
        <div class="missing-skill-item__content">
          <p class="missing-skill-item__name">${escHtml(item.skill || item)}</p>
          ${item.reason ? `<p class="missing-skill-item__reason">${escHtml(item.reason)}</p>` : ''}
        </div>
      `;
      container.appendChild(div);
    });
  }

  /* ─── Bonus Skills ─── */
  function renderBonusSkills(skills) {
    const container = document.getElementById('bonusSkills');
    const countEl = document.getElementById('bonusCount');
    if (!container) return;

    container.innerHTML = '';
    if (countEl) countEl.textContent = skills.length;

    skills.forEach((skill, i) => {
      const tag = document.createElement('span');
      tag.className = `skill-tag skill-tag--bonus stagger-${(i % 8) + 1}`;
      tag.innerHTML = `<i data-lucide="star" style="width:12px;height:12px;"></i> ${escHtml(skill)}`;
      container.appendChild(tag);
    });
  }

  /* ─── Roadmap ─── */
  function renderRoadmap(phases) {
    const container = document.getElementById('roadmapTimeline');
    if (!container) return;

    container.innerHTML = '';

    phases.forEach((phase, i) => {
      const div = document.createElement('div');
      div.className = `roadmap-phase stagger-${(i % 8) + 1}`;

      let skillTags = '';
      if (phase.skills?.length) {
        skillTags = `<div class="roadmap-phase__skills">
          ${phase.skills.map((s) => `<span class="roadmap-phase__skill-tag">${escHtml(s)}</span>`).join('')}
        </div>`;
      }

      let resources = '';
      if (phase.resources?.length) {
        resources = `<div class="roadmap-phase__resources">
          ${phase.resources
            .map((r) => {
              const type = (r.type || 'resource').toLowerCase();
              const name = r.name || r;
              const platform = r.platform ? ` · ${escHtml(r.platform)}` : '';
              const link = r.url
                ? `<a href="${escHtml(r.url)}" target="_blank" rel="noopener">${escHtml(name)}</a>`
                : escHtml(name);
              return `<div class="roadmap-resource">
                <span class="roadmap-resource__type roadmap-resource__type--${type}">${type}</span>
                ${link}${platform}
              </div>`;
            })
            .join('')}
        </div>`;
      }

      div.innerHTML = `
        <div class="roadmap-phase__dot"></div>
        <div class="roadmap-phase__header">
          <span class="roadmap-phase__number">Phase ${phase.phase || i + 1}</span>
          <h4 class="roadmap-phase__title">${escHtml(phase.title || '')}</h4>
          <span class="roadmap-phase__duration">${escHtml(phase.duration || '')}</span>
        </div>
        ${skillTags}
        ${resources}
      `;

      container.appendChild(div);
    });
  }

  /* ─── ATS Tips ─── */
  function renderAtsTips(tips) {
    const container = document.getElementById('atsTipsList');
    if (!container) return;

    container.innerHTML = '';

    tips.forEach((tip, i) => {
      const li = document.createElement('li');
      li.className = `stagger-${(i % 8) + 1}`;
      li.textContent = tip;
      container.appendChild(li);
    });
  }

  /* ─── Career Paths ─── */
  function renderCareerPaths(paths) {
    const container = document.getElementById('careerPaths');
    if (!container) return;

    container.innerHTML = '';

    paths.forEach((p, i) => {
      const score = p.fitScore || 0;
      let tier = 'low';
      if (score >= 75) tier = 'high';
      else if (score >= 50) tier = 'medium';

      const div = document.createElement('div');
      div.className = `career-path-item stagger-${(i % 8) + 1}`;
      div.innerHTML = `
        <div class="career-path-item__score career-path-item__score--${tier}">${score}</div>
        <div class="career-path-item__info">
          <p class="career-path-item__role">${escHtml(p.role || '')}</p>
          <p class="career-path-item__desc">${escHtml(p.description || '')}</p>
          ${p.salaryRange ? `<p class="career-path-item__salary">${escHtml(p.salaryRange)}</p>` : ''}
        </div>
      `;
      container.appendChild(div);
    });
  }

  /* ─── Resume Improvements ─── */
  function renderImprovements(items) {
    const container = document.getElementById('improvementsList');
    if (!container) return;

    container.innerHTML = '';

    items.forEach((item, i) => {
      const li = document.createElement('li');
      li.className = `stagger-${(i % 8) + 1}`;
      li.textContent = item;
      container.appendChild(li);
    });
  }

  /* ─── Helpers ─── */
  function animateCounter(el, from, to, duration, delay = 0) {
    setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        // Ease-out
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(from + (to - from) * eased);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
  }

  function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { render };
})();
