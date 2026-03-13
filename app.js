// ===== Workout Tracker App =====
(function () {
  'use strict';

  // ===== Configuration =====
  const STORAGE_KEY = 'workout_tracker_data';
  const SETS_PER_EXERCISE = 3;
  const VOLUME_WINDOW_DAYS = 14;

  // ===== Exercise Definitions =====
  const MUSCLE_GROUPS = {
    back: {
      label: 'Back',
      icon: '🔙',
      target: 15,
      exercises: [
        { id: 'pullup', name: 'Pull Up / Pull Down', icon: '💪', sets: 3 },
        { id: 'row', name: 'Row', icon: '🚣', sets: 3 },
        { id: 'upperback', name: 'Upper Back', icon: '🔝', sets: 3 },
        { id: 'back_misc', name: 'Misc', icon: '➕', sets: 3 },
      ],
    },
    shoulders: {
      label: 'Shoulders',
      icon: '🏋️',
      target: 15,
      exercises: [
        { id: 'lateral_raise', name: 'Lateral Raise', icon: '🤸', sets: 3 },
        { id: 'overhead_press', name: 'Overhead Press', icon: '⬆️', sets: 3 },
        { id: 'rear_delt', name: 'Rear Delt', icon: '🔄', sets: 3 },
        { id: 'shoulders_misc', name: 'Misc', icon: '➕', sets: 3 },
      ],
    },
    chest: {
      label: 'Chest',
      icon: '🫁',
      target: 15,
      exercises: [
        { id: 'chest_press', name: 'Press', icon: '🏋️', sets: 3 },
        { id: 'flys', name: 'Flys', icon: '🦅', sets: 3 },
        { id: 'chest_misc', name: 'Misc', icon: '➕', sets: 3 },
      ],
    },
    legs: {
      label: 'Legs',
      icon: '🦵',
      target: 18,
      exercises: [
        { id: 'leg_press', name: 'Leg Press', icon: '🦿', sets: 3 },
        { id: 'leg_extension', name: 'Leg Extension', icon: '🦵', sets: 3 },
        { id: 'leg_curl', name: 'Leg Curl', icon: '🔄', sets: 3 },
        { id: 'calf_raise', name: 'Calf Raise', icon: '🦶', sets: 3 },
        { id: 'rdl', name: 'RDL', icon: '🏋️', sets: 3 },
        { id: 'squats', name: 'Squats', icon: '⬇️', sets: 3 },
        { id: 'legs_misc', name: 'Misc', icon: '➕', sets: 3 },
      ],
    },
    arms: {
      label: 'Arms',
      icon: '💪',
      target: 18,
      exercises: [
        { id: 'bicep_curls', name: 'Bicep Curls', icon: '💪', sets: 3 },
        { id: 'forearms', name: 'Forearms', icon: '🤜', sets: 3 },
        { id: 'triceps', name: 'Triceps', icon: '🔻', sets: 3 },
        { id: 'arms_misc', name: 'Misc', icon: '➕', sets: 3 },
      ],
    },
    cardio: {
      label: 'Cardio',
      icon: '🏃',
      target: 6,
      exercises: [
        { id: 'run', name: 'Run', icon: '🏃', sets: 1 },
      ],
    },
  };

  // ===== State =====
  let data = loadData();
  let activeGroup = 'back';
  let undoTimeout = null;
  let lastAction = null;

  // ===== Persistence =====
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load data', e);
    }
    return { logs: {} };
    // logs: { [exerciseId]: [ { date: "YYYY-MM-DD" }, ... ] }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data', e);
    }
  }

  // ===== Date Helpers =====
  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function parseDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function daysBetween(dateStr1, dateStr2) {
    const d1 = parseDate(dateStr1);
    const d2 = parseDate(dateStr2);
    return Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
  }

  function daysAgo(dateStr) {
    return daysBetween(dateStr, todayStr());
  }

  function formatDateNice(dateStr) {
    const d = parseDate(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function daysAgoLabel(n) {
    if (n === 0) return 'Today';
    if (n === 1) return 'Yesterday';
    if (n < 7) return `${n}d ago`;
    if (n < 30) return `${Math.floor(n / 7)}w ago`;
    if (n < 365) return `${Math.floor(n / 30)}mo ago`;
    return `${Math.floor(n / 365)}y ago`;
  }

  function freshnessClass(n) {
    if (n <= 7) return 'fresh';
    if (n <= 21) return 'stale';
    return 'old';
  }

  // ===== Data Queries =====
  function getExerciseLogs(exerciseId) {
    return (data.logs[exerciseId] || []).sort((a, b) => b.date.localeCompare(a.date));
  }

  function getTodaySetsCount(exerciseId) {
    const today = todayStr();
    return (data.logs[exerciseId] || []).filter(l => l.date === today).length;
  }

  function getLastDate(exerciseId) {
    const logs = getExerciseLogs(exerciseId);
    return logs.length > 0 ? logs[0].date : null;
  }

  function getRecentDates(exerciseId) {
    const logs = getExerciseLogs(exerciseId);
    const unique = [...new Set(logs.map(l => l.date))];
    return unique.slice(0, 5);
  }

  function getGroupVolume14Days(groupKey) {
    const group = MUSCLE_GROUPS[groupKey];
    const today = todayStr();
    let total = 0;
    for (const ex of group.exercises) {
      const logs = data.logs[ex.id] || [];
      total += logs.filter(l => daysBetween(l.date, today) <= VOLUME_WINDOW_DAYS).length * ex.sets;
    }
    return total;
  }

  // ===== Actions =====
  function logExercise(exerciseId) {
    if (!data.logs[exerciseId]) data.logs[exerciseId] = [];
    const entry = { date: todayStr(), ts: Date.now() };
    data.logs[exerciseId].push(entry);
    saveData();

    lastAction = { exerciseId, entry };
    showUndo(exerciseId);
    renderAll();
  }

  function undoLast() {
    if (!lastAction) return;
    const { exerciseId, entry } = lastAction;
    const logs = data.logs[exerciseId];
    if (logs) {
      const idx = logs.findIndex(l => l.ts === entry.ts);
      if (idx !== -1) {
        logs.splice(idx, 1);
        saveData();
      }
    }
    lastAction = null;
    hideUndo();
    renderAll();
  }

  function deleteLog(exerciseId, ts) {
    const logs = data.logs[exerciseId];
    if (logs) {
      const idx = logs.findIndex(l => l.ts === ts);
      if (idx !== -1) {
        logs.splice(idx, 1);
        saveData();
      }
    }
    renderAll();
  }

  // ===== Rendering =====
  function renderAll() {
    renderDate();
    renderSummary();
    renderExercises();
  }

  function renderDate() {
    const el = document.getElementById('today-date');
    const d = new Date();
    el.textContent = d.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  function renderSummary() {
    const container = document.getElementById('summary-bars');
    container.innerHTML = '';

    const groupKeys = Object.keys(MUSCLE_GROUPS);
    let maxTarget = 0;
    for (const key of groupKeys) {
      maxTarget = Math.max(maxTarget, MUSCLE_GROUPS[key].target);
    }

    for (const key of groupKeys) {
      const group = MUSCLE_GROUPS[key];
      const vol = getGroupVolume14Days(key);
      const pct = Math.min((vol / group.target) * 100, 100);

      const row = document.createElement('div');
      row.className = 'summary-row';
      row.innerHTML = `
        <span class="summary-label">${group.label}</span>
        <div class="summary-bar-track">
          <div class="summary-bar-fill group-${key}" style="width:${pct}%"></div>
          <span class="summary-bar-value">${vol} / ${group.target}</span>
        </div>
      `;
      container.appendChild(row);
    }
  }

  function renderExercises() {
    const container = document.getElementById('exercises');
    container.innerHTML = '';

    const group = MUSCLE_GROUPS[activeGroup];
    if (!group) return;

    for (const ex of group.exercises) {
      const todaySets = getTodaySetsCount(ex.id);
      const maxSets = ex.sets;
      const lastDate = getLastDate(ex.id);
      const ago = lastDate ? daysAgo(lastDate) : null;

      const card = document.createElement('div');
      card.className = `exercise-card group-${activeGroup}`;
      if (todaySets > 0) card.classList.add('just-logged');

      // Build set dots
      let dotsHtml = '';
      for (let i = 0; i < maxSets; i++) {
        dotsHtml += `<span class="set-dot ${i < todaySets ? 'filled' : ''}"></span>`;
      }

      // Build meta
      let metaHtml = '';
      if (lastDate) {
        metaHtml = `<span class="${freshnessClass(ago)}">${daysAgoLabel(ago)}</span>`;
      } else {
        metaHtml = `<span class="old">Never</span>`;
      }

      card.innerHTML = `
        <div class="exercise-icon">${ex.icon}</div>
        <div class="exercise-info">
          <div class="exercise-name">${sanitize(ex.name)}</div>
          <div class="exercise-meta">${metaHtml}</div>
        </div>
        <div class="exercise-sets">${dotsHtml}</div>
        ${todaySets > 0 ? `<span class="today-sets-badge">${todaySets * maxSets}s</span>` : ''}
        <button class="exercise-more" data-exercise="${ex.id}" aria-label="History">⋯</button>
      `;

      // Tap on card body to log a set
      card.addEventListener('click', (e) => {
        if (e.target.closest('.exercise-more')) return;
        logExercise(ex.id);
        showToast(`+${maxSets} sets ${sanitize(ex.name)}`);
      });

      // Tap ⋯ for history
      card.querySelector('.exercise-more').addEventListener('click', (e) => {
        e.stopPropagation();
        openHistory(ex);
      });

      container.appendChild(card);
    }
  }

  // ===== History Modal =====
  function openHistory(exercise) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    title.textContent = exercise.name;

    const logs = getExerciseLogs(exercise.id);
    if (logs.length === 0) {
      body.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:20px 0;">No history yet.</p>';
    } else {
      // Group by date
      const byDate = {};
      for (const log of logs) {
        if (!byDate[log.date]) byDate[log.date] = [];
        byDate[log.date].push(log);
      }

      let html = '';
      for (const [date, entries] of Object.entries(byDate)) {
        const ago = daysAgo(date);
        html += `
          <div class="history-entry">
            <div>
              <div class="history-date">${formatDateNice(date)}</div>
              <div class="history-ago ${freshnessClass(ago)}">${daysAgoLabel(ago)}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:600">${entries.length} × ${exercise.sets} sets</div>
              <div style="font-size:0.75rem;color:var(--text-dim)">${entries.length * exercise.sets} total sets</div>
            </div>
          </div>
        `;
      }

      html += `
        <div class="modal-actions">
          <button class="btn btn-danger" id="clear-history-btn">Clear All History</button>
        </div>
      `;

      body.innerHTML = html;

      document.getElementById('clear-history-btn').addEventListener('click', () => {
        if (confirm(`Clear all history for ${exercise.name}?`)) {
          data.logs[exercise.id] = [];
          saveData();
          closeModal();
          renderAll();
        }
      });
    }

    modal.classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('modal').classList.add('hidden');
  }

  // ===== Toast / Undo =====
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add('hidden'), 1500);
  }

  function showUndo(exerciseId) {
    // Remove existing undo bar
    hideUndo();
    const bar = document.createElement('div');
    bar.className = 'undo-bar';
    bar.id = 'undo-bar';
    bar.innerHTML = `
      <span>Logged exercise</span>
      <button class="undo-btn">UNDO</button>
    `;
    bar.querySelector('.undo-btn').addEventListener('click', undoLast);
    document.getElementById('app').appendChild(bar);

    undoTimeout = setTimeout(hideUndo, 5000);
  }

  function hideUndo() {
    clearTimeout(undoTimeout);
    const bar = document.getElementById('undo-bar');
    if (bar) bar.remove();
  }

  // ===== Security: Sanitize =====
  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== Tab Navigation =====
  function initTabs() {
    const tabButtons = document.querySelectorAll('.tab');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeGroup = btn.dataset.group;
        renderExercises();
      });
    });
  }

  // ===== Modal Close =====
  function initModal() {
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  }

  // ===== Import Seed Data From Spreadsheet =====
  function seedIfEmpty() {
    // Only seed if no data exists
    if (Object.keys(data.logs).length > 0) return;

    // Seed historical data from the spreadsheet attachment
    const seedData = {
      pullup: ['2025-09-13', '2025-10-02', '2026-01-06', '2026-03-02', '2026-03-12'],
      row: ['2025-01-29', '2026-01-06', '2026-03-02', '2026-03-12'],
      upperback: ['2026-01-20', '2026-01-25'],
      lateral_raise: ['2025-02-10', '2025-12-21', '2026-02-02', '2026-02-28'],
      overhead_press: ['2025-01-29', '2025-02-09', '2026-02-02', '2026-02-28'],
      rear_delt: ['2024-08-10', '2025-09-23', '2025-12-01', '2026-02-28'],
      chest_press: ['2025-11-24', '2026-01-03', '2026-02-23', '2026-03-02'],
      flys: ['2024-12-18', '2025-11-24', '2026-02-23', '2026-03-02'],
      chest_misc: ['2024-06-24'],
      leg_press: ['2025-11-18', '2026-02-28', '2026-03-02'],
      leg_extension: ['2025-04-26', '2025-05-04', '2025-07-19', '2025-12-01'],
      leg_curl: ['2025-05-04', '2025-08-22', '2025-12-01', '2026-03-12'],
      calf_raise: ['2024-07-03', '2024-07-12', '2026-01-25'],
      rdl: ['2026-01-17', '2026-01-25'],
      squats: ['2026-01-17', '2026-01-25'],
      bicep_curls: ['2026-02-28', '2026-03-02', '2026-03-12', '2026-03-12'],
      forearms: ['2025-01-30', '2025-06-06', '2026-01-16'],
      triceps: ['2024-09-26', '2025-06-06', '2026-01-24', '2026-02-28'],
      arms_misc: ['2025-01-22', '2025-01-23'],
      run: ['2026-01-24', '2026-02-23', '2026-02-27', '2026-03-01', '2026-03-07'],
    };

    for (const [exerciseId, dates] of Object.entries(seedData)) {
      data.logs[exerciseId] = dates.map(date => ({ date, ts: parseDate(date).getTime() }));
    }

    saveData();
  }

  // ===== Init =====
  function init() {
    seedIfEmpty();
    initTabs();
    initModal();
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
