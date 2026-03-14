// ===== Workout Tracker App =====
(function () {
  'use strict';

  // ===== Configuration =====
  const STORAGE_KEY = 'workout_tracker_data';
  const VOLUME_WINDOW_DAYS = 14;

  // ===== Exercise Definitions =====
  const MUSCLE_GROUPS = {
    back: {
      label: 'Back',
      icon: '🔙',
      target: 15,
      exercises: [
        { id: 'pullup', name: 'Pull Up / Pull Down', icon: '💪', dots: 4 },
        { id: 'row', name: 'Row', icon: '🚣', dots: 4 },
        { id: 'upperback', name: 'Upper Back', icon: '🔝', dots: 4 },
      ],
    },
    shoulders: {
      label: 'Shoulders',
      icon: '🏋️',
      target: 15,
      exercises: [
        { id: 'lateral_raise', name: 'Lateral Raise', icon: '🤸', dots: 4 },
        { id: 'overhead_press', name: 'Overhead Press', icon: '⬆️', dots: 4 },
        { id: 'rear_delt', name: 'Rear Delt', icon: '🔄', dots: 4 },
      ],
    },
    chest: {
      label: 'Chest',
      icon: '🫁',
      target: 15,
      exercises: [
        { id: 'chest_press', name: 'Press', icon: '🏋️', dots: 4 },
        { id: 'flys', name: 'Flys', icon: '🦅', dots: 4 },
      ],
    },
    legs: {
      label: 'Legs',
      icon: '🦵',
      target: 18,
      exercises: [
        { id: 'leg_press', name: 'Leg Press', icon: '🦿', dots: 4 },
        { id: 'leg_extension', name: 'Leg Extension', icon: '🦵', dots: 4 },
        { id: 'leg_curl', name: 'Leg Curl', icon: '🔄', dots: 4 },
        { id: 'calf_raise', name: 'Calf Raise', icon: '🦶', dots: 4 },
        { id: 'rdl', name: 'RDL', icon: '🏋️', dots: 4 },
        { id: 'squats', name: 'Squats', icon: '⬇️', dots: 4 },
      ],
    },
    arms: {
      label: 'Arms',
      icon: '💪',
      target: 18,
      exercises: [
        { id: 'bicep_curls', name: 'Bicep Curls', icon: '💪', dots: 4 },
        { id: 'forearms', name: 'Forearms', icon: '🤜', dots: 4 },
        { id: 'triceps', name: 'Triceps', icon: '🔻', dots: 4 },
      ],
    },
    cardio: {
      label: 'Cardio',
      icon: '🏃',
      target: 6,
      exercises: [
        { id: 'run', name: 'Run', icon: '🏃', dots: 1 },
        { id: 'stairs', name: 'Stairs', icon: '🪜', dots: 1 },
        { id: 'rowing', name: 'Rowing', icon: '🚣', dots: 1 },
        { id: 'sports', name: 'Sports', icon: '⚽', dots: 1 },
        { id: 'walking', name: 'Walking', icon: '🚶', dots: 1 },
      ],
    },
  };

  // ===== Lookup Maps =====
  // Precompute exercise → group lookup for fast group identification
  const EXERCISE_GROUP_MAP = {};
  for (const [key, group] of Object.entries(MUSCLE_GROUPS)) {
    for (const ex of group.exercises) {
      EXERCISE_GROUP_MAP[ex.id] = key;
    }
  }

  // Color per muscle group — used in summary bars and celebration effects
  const GROUP_COLORS = {
    back: '#63b3ff',
    shoulders: '#ff9f43',
    chest: '#ff6b81',
    legs: '#2ed573',
    arms: '#ce82ff',
    cardio: '#ffea64',
  };

  // ===== State =====
  let data = loadData();
  // Ensure customExercises exists for older data
  if (!data.customExercises) data.customExercises = {};

  // Also register any saved custom exercises
  for (const [key, exercises] of Object.entries(data.customExercises)) {
    for (const ex of exercises) {
      EXERCISE_GROUP_MAP[ex.id] = key;
    }
  }

  if (!data.exerciseOverrides) data.exerciseOverrides = {};
  if (!data.hiddenExercises) data.hiddenExercises = {};

  let activeGroup = null;
  let pushWindow = null; // { exerciseId, ts, timer }
  let lastCelebratedMilestone = 0; // track highest milestone celebrated this session
  let cardioCelebratedToday = false;
  const celebratedGoals = new Set(); // track groups that have been goal-celebrated this session
  const _sanitizeEl = document.createElement('div');

  // Milestone tiers for non-cardio daily sets
  const MILESTONES = [
    { sets: 3,  label: 'Warming Up', emoji: '🔥', particles: 14,  duration: 1500, vibrate: [50] },
    { sets: 6,  label: 'Getting Strong', emoji: '💪', particles: 24, duration: 2000, vibrate: [50, 30, 50] },
    { sets: 9,  label: 'On Fire', emoji: '🔥🔥', particles: 36, duration: 2400, vibrate: [50, 30, 80] },
    { sets: 12, label: 'Beast Mode', emoji: '⚡', particles: 50, duration: 2800, vibrate: [60, 40, 60, 40, 100] },
    { sets: 15, label: 'Unstoppable', emoji: '🚀', particles: 70, duration: 3200, vibrate: [80, 50, 80, 50, 150] },
    { sets: 18, label: 'Legend', emoji: '🏆', particles: 95, duration: 3600, vibrate: [100, 60, 100, 60, 200] },
  ];

  // ===== Persistence (localStorage) =====
  // Data schema:
  //   logs:              { [exerciseId]: [ { date, ts?, push? }, ... ] }
  //   targets:           { [groupKey]: number }
  //   customExercises:   { [groupKey]: [ { id, name, icon, dots } ] }
  //   exerciseOverrides: { [exerciseId]: { name, icon } }
  //   hiddenExercises:   { [groupKey]: [ exerciseId, ... ] }
  //   personalRecords:   { [exerciseId]: { value: string, unit: string, date: string, history: [ { value, unit, date } ] } }
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load data', e);
    }
    return { logs: {}, targets: {}, customExercises: {}, exerciseOverrides: {}, hiddenExercises: {}, personalRecords: {} };
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
    return `${n} days ago`;
  }

  function freshnessClass(n) {
    if (n === 0) return 'freshness-today';
    if (n === 1) return 'freshness-yesterday';
    if (n <= 12) return 'freshness-recent';
    if (n <= 14) return 'freshness-expiring';
    return 'freshness-stale';
  }

  // ===== Data Queries =====
  // All logs for an exercise, sorted newest-first
  function getExerciseLogs(exerciseId) {
    return (data.logs[exerciseId] || []).sort((a, b) => b.date.localeCompare(a.date));
  }

  function getTodayLogs(exerciseId) {
    const today = todayStr();
    return (data.logs[exerciseId] || []).filter(l => l.date === today);
  }

  function getLastDate(exerciseId) {
    const logs = getExerciseLogs(exerciseId);
    return logs.length > 0 ? logs[0].date : null;
  }

  function getGroupVolume14Days(groupKey) {
    const { total } = getGroupStats14Days(groupKey);
    return total;
  }

  // Volume and freshness buckets for a group within the 14-day window
  function getGroupStats14Days(groupKey) {
    const exercises = getGroupExercises(groupKey);
    const today = todayStr();
    let total = 0;
    let pushed = 0;
    // Freshness buckets: today(0), yesterday(1), recent(2-12), expiring(13-14)
    const buckets = { today: 0, yesterday: 0, recent: 0, expiring: 0 };
    for (const ex of exercises) {
      const logs = data.logs[ex.id] || [];
      for (const l of logs) {
        const ago = daysBetween(l.date, today);
        if (ago < VOLUME_WINDOW_DAYS) {
          total++;
          if (l.push) pushed++;
          if (ago === 0) buckets.today++;
          else if (ago === 1) buckets.yesterday++;
          else if (ago <= 12) buckets.recent++;
          else buckets.expiring++;
        }
      }
    }
    return { total, pushed, buckets };
  }

  // Priority scoring: higher score = more recommended to train next.
  // Factors: volume deficit vs goal, sets about to expire, recency.
  function getGroupPriorities() {
    const today = todayStr();
    const scores = {};
    for (const key of Object.keys(MUSCLE_GROUPS)) {
      const target = getTarget(key);
      const { total, buckets } = getGroupStats14Days(key);
      const deficit = Math.max(0, target - total);

      // 1) Volume deficit score (0–100): how far behind goal
      const deficitScore = target > 0 ? (deficit / target) * 100 : 0;

      // 2) Expiry urgency: sets expiring soon add pressure
      const expiryScore = target > 0 ? (buckets.expiring / target) * 40 : 0;

      // 3) Recency penalty: trained today → lower priority
      const exercises = getGroupExercises(key);
      let mostRecentAgo = VOLUME_WINDOW_DAYS;
      for (const ex of exercises) {
        const last = getLastDate(ex.id);
        if (last) mostRecentAgo = Math.min(mostRecentAgo, daysAgo(last));
      }
      // If trained today: heavy penalty. Yesterday: small penalty. 2+ days: bonus
      let recencyScore = 0;
      if (mostRecentAgo === 0) recencyScore = -50;
      else if (mostRecentAgo === 1) recencyScore = -15;
      else recencyScore = Math.min(mostRecentAgo * 5, 30);

      scores[key] = {
        score: deficitScore + expiryScore + recencyScore,
        trainedToday: mostRecentAgo === 0,
        deficit,
        total,
      };
    }
    return scores;
  }

  // Count non-cardio sets logged today (for milestone tracking)
  function getDailySetCount() {
    const today = todayStr();
    const cardioIds = new Set(MUSCLE_GROUPS.cardio.exercises.map(e => e.id));
    let count = 0;
    for (const [id, logs] of Object.entries(data.logs)) {
      if (cardioIds.has(id)) continue;
      count += logs.filter(l => l.date === today).length;
    }
    return count;
  }

  // Count distinct cardio exercises logged today
  function getDailyCardioCount() {
    const today = todayStr();
    const cardioIds = MUSCLE_GROUPS.cardio.exercises.map(e => e.id);
    let count = 0;
    for (const id of cardioIds) {
      if ((data.logs[id] || []).some(l => l.date === today)) count++;
    }
    return count;
  }

  // ===== Actions (log, undo, push sets) =====
  function logExercise(exerciseId) {
    if (!data.logs[exerciseId]) data.logs[exerciseId] = [];

    // Snapshot before logging
    const groupKey = EXERCISE_GROUP_MAP[exerciseId] || null;
    const volBefore = groupKey ? getGroupVolume14Days(groupKey) : 0;
    const target = groupKey ? getTarget(groupKey) : 0;

    const entry = { date: todayStr(), ts: Date.now() };
    data.logs[exerciseId].push(entry);
    saveData();

    // Snapshot after logging
    const volAfter = groupKey ? getGroupVolume14Days(groupKey) : 0;
    const dailyAfter = getDailySetCount();

    // Check milestone celebrations (non-cardio)
    const isCardio = MUSCLE_GROUPS.cardio.exercises.some(e => e.id === exerciseId);
    if (!isCardio) {
      checkMilestone(dailyAfter);
      updateStreakBadge(dailyAfter);
    } else if (!cardioCelebratedToday) {
      cardioCelebratedToday = true;
      celebrateCardio();
    }
    // Group goal celebration
    if (target > 0 && volBefore < target && volAfter >= target && !celebratedGoals.has(groupKey)) {
      celebratedGoals.add(groupKey);
      celebrateGroupGoal(groupKey);
    }

    // Open push window
    if (pushWindow) clearTimeout(pushWindow.timer);
    pushWindow = { exerciseId, ts: entry.ts, timer: setTimeout(clearPushWindow, 3000) };

    renderAll();
  }

  function removeLastTodaySet(exerciseId) {
    const today = todayStr();
    const logs = data.logs[exerciseId] || [];
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].date === today) {
        logs.splice(i, 1);
        saveData();
        updateStreakBadge(getDailySetCount());
        renderAll();
        showToast('-1 set');
        return;
      }
    }
  }

  function markLastSetAsPush(exerciseId) {
    if (!pushWindow || pushWindow.exerciseId !== exerciseId) return;
    const logs = data.logs[exerciseId] || [];
    const entry = logs.find(l => l.ts === pushWindow.ts);
    if (entry) {
      entry.push = true;
      saveData();
    }
    clearTimeout(pushWindow.timer);
    pushWindow = null;
    renderAll();
    const ex = findExercise(exerciseId);
    showToast(`+1 🔥 set ${ex ? sanitize(ex.name) : ''}`);
  }

  function clearPushWindow() {
    if (!pushWindow) return;
    clearTimeout(pushWindow.timer);
    pushWindow = null;
    // Re-render to revert action button from 🔥 back to −
    skipAnimation = true;
    renderExercises();
    skipAnimation = false;
  }

  function applyOverride(ex) {
    const ov = data.exerciseOverrides[ex.id];
    if (!ov) return ex;
    return { ...ex, name: ov.name || ex.name, icon: ov.icon || ex.icon };
  }

  function findExercise(exerciseId) {
    for (const group of Object.values(MUSCLE_GROUPS)) {
      const ex = group.exercises.find(e => e.id === exerciseId);
      if (ex) return applyOverride(ex);
    }
    for (const customs of Object.values(data.customExercises)) {
      const ex = customs.find(e => e.id === exerciseId);
      if (ex) return applyOverride(ex);
    }
    return null;
  }

  function getGroupExercises(groupKey) {
    const hidden = data.hiddenExercises[groupKey] || [];
    const builtIn = MUSCLE_GROUPS[groupKey].exercises.filter(e => !hidden.includes(e.id));
    const custom = (data.customExercises[groupKey] || []);
    return builtIn.concat(custom).map(applyOverride);
  }

  function addCustomExercise(groupKey, name) {
    if (!data.customExercises[groupKey]) data.customExercises[groupKey] = [];
    const id = 'custom_' + groupKey + '_' + Date.now();
    const ex = { id, name, icon: '🏋️', dots: 4 };
    data.customExercises[groupKey].push(ex);
    EXERCISE_GROUP_MAP[id] = groupKey;
    saveData();
    return ex;
  }

  function removeCustomExercise(groupKey, exerciseId) {
    if (!data.customExercises[groupKey]) return;
    data.customExercises[groupKey] = data.customExercises[groupKey].filter(e => e.id !== exerciseId);
    delete EXERCISE_GROUP_MAP[exerciseId];
    delete data.logs[exerciseId];
    saveData();
  }

  // ===== Exercise Delete =====
  function deleteExercise(exerciseId, groupKey) {
    const isCustom = exerciseId.startsWith('custom_');
    const ex = findExercise(exerciseId);
    const name = ex ? sanitize(ex.name) : exerciseId;
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    if (isCustom) {
      removeCustomExercise(groupKey, exerciseId);
    } else {
      if (!data.hiddenExercises[groupKey]) data.hiddenExercises[groupKey] = [];
      data.hiddenExercises[groupKey].push(exerciseId);
      delete data.logs[exerciseId];
      delete data.exerciseOverrides[exerciseId];
      saveData();
    }
    updateStreakBadge(getDailySetCount());
    showToast(`Deleted ${name}`);
    renderAll();
  }

  // ===== Rendering =====
  let skipAnimation = false; // Suppress card entrance animations during bulk re-renders

  function renderAll() {
    renderDate();
    renderSummary();
    // Skip entrance animations when re-rendering after data changes
    skipAnimation = true;
    renderExercises();
    skipAnimation = false;
  }

  function renderDate() {
    const el = document.getElementById('today-date');
    const d = new Date();
    el.textContent = d.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  // User-customizable 14-day volume target per group
  function getTarget(groupKey) {
    if (data.targets && data.targets[groupKey] != null) return data.targets[groupKey];
    return MUSCLE_GROUPS[groupKey].target;
  }

  function setTarget(groupKey, value) {
    if (!data.targets) data.targets = {};
    data.targets[groupKey] = value;
    saveData();
  }

  function renderSummary() {
    const container = document.getElementById('summary-bars');
    container.innerHTML = '';

    const groupKeys = Object.keys(MUSCLE_GROUPS);
    const priorities = getGroupPriorities();

    // Rank groups by score (descending) — only non-active view
    const ranked = groupKeys
      .map(k => ({ key: k, ...priorities[k] }))
      .sort((a, b) => b.score - a.score);
    const topKey = ranked[0] ? ranked[0].key : null;
    const focusKeys = new Set(ranked.slice(0, 2).filter(r => r.score > 0).map(r => r.key));

    for (const key of groupKeys) {
      // When a group is active, only render that group
      if (activeGroup && key !== activeGroup) continue;

      const group = MUSCLE_GROUPS[key];
      const target = getTarget(key);
      const { total: vol, pushed: pushVol } = getGroupStats14Days(key);
      const color = GROUP_COLORS[key] || '#6c63ff';
      const fillPct = target > 0 ? Math.min((vol / target) * 100, 100) : 0;
      const pushPct = target > 0 ? Math.min((pushVol / target) * 100, 100) : 0;

      const pri = priorities[key];
      const isFocus = !activeGroup && focusKeys.has(key);
      const isTop = !activeGroup && key === topKey && pri.score > 0;
      const isResting = !activeGroup && pri.trainedToday && pri.deficit <= 0;

      const labelText = (isTop ? '🎯 ' : '') + group.label;

      const row = document.createElement('div');
      row.className = 'summary-row';
      row.dataset.group = key;
      if (key === activeGroup) row.classList.add('active');
      if (isFocus) row.classList.add('focus-glow');
      if (isResting) row.classList.add('needs-rest');

      // Set group color as CSS variable for glow
      if (isFocus) row.style.setProperty('--group-color', color);

      row.innerHTML = `
        <span class="summary-label">${labelText}</span>
        <div class="summary-bar-track">
          <div class="summary-bar-fill" style="width:${fillPct}%;background:${color}"></div>
          ${pushVol > 0 ? `<div class="summary-bar-push" style="width:${pushPct}%"></div>` : ''}
          <span class="summary-bar-value">${vol} / ${target}</span>
        </div>
      `;
      row.addEventListener('click', (e) => {
        if (e.target.closest('.target-btn')) return;
        if (activeGroup) {
          switchToGroup(activeGroup); // toggles off
        } else {
          switchToGroup(key);
        }
      });

      container.appendChild(row);

      // Add stepper row below active bar
      if (key === activeGroup) {
        const stepperRow = document.createElement('div');
        stepperRow.className = 'target-stepper-row';
        stepperRow.innerHTML = `
          <span class="target-label">14-Day Goal</span>
          <button class="target-btn" data-dir="-1" aria-label="Decrease target">&minus;</button>
          <span class="target-value">${target}</span>
          <button class="target-btn" data-dir="1" aria-label="Increase target">&plus;</button>
        `;
        stepperRow.querySelectorAll('.target-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const dir = parseInt(btn.dataset.dir, 10);
            const newTarget = Math.max(1, getTarget(key) + dir);
            setTarget(key, newTarget);
            renderSummary();
          });
        });
        container.appendChild(stepperRow);
      }
    }
  }

  function renderExercises() {
    const container = document.getElementById('exercises');
    container.innerHTML = '';

    const group = MUSCLE_GROUPS[activeGroup];
    if (!group) return;

    let idx = 0;
    const exercises = getGroupExercises(activeGroup);
    for (const ex of exercises) {
      const todayLogs = getTodayLogs(ex.id);
      const todaySets = todayLogs.length;
      const lastDate = getLastDate(ex.id);
      const ago = lastDate ? daysAgo(lastDate) : null;

      const card = document.createElement('div');
      card.className = `exercise-card group-${activeGroup}`;
      const withinWindow = lastDate && ago < VOLUME_WINDOW_DAYS;
      if (withinWindow) card.classList.add(freshnessClass(ago));

      // Build set dots — each dot = 1 set today, pushed sets get gold
      const dotCount = ex.dots;
      let dotsHtml = '';
      for (let i = 0; i < dotCount; i++) {
        if (i < todaySets) {
          const isPushed = todayLogs[i] && todayLogs[i].push;
          dotsHtml += `<span class="set-dot filled${isPushed ? ' pushed' : ''}"></span>`;
        } else {
          dotsHtml += `<span class="set-dot"></span>`;
        }
      }

      // Build meta
      let metaHtml = '';
      if (withinWindow) {
        metaHtml = `<span class="${freshnessClass(ago)}">${daysAgoLabel(ago)}</span>`;
      }

      // Check if push window is active for this exercise
      const hasPushWindow = pushWindow && pushWindow.exerciseId === ex.id;

      const isCustom = ex.id.startsWith('custom_');

      // Action button: shows 🔥 during push window, − when sets exist, hidden otherwise
      let actionBtnHtml = '';
      if (hasPushWindow) {
        actionBtnHtml = `<button class="card-action-btn card-action-push" data-exercise="${ex.id}" aria-label="Mark as heavy set">🔥</button>`;
      } else if (todaySets > 0) {
        actionBtnHtml = `<button class="card-action-btn" data-exercise="${ex.id}" aria-label="Remove last set">−</button>`;
      }

      // PR badge if one exists
      const pr = data.personalRecords && data.personalRecords[ex.id];
      const prBadgeHtml = pr ? `<span class="pr-badge">PR: ${sanitize(pr.value)}${pr.unit ? ' ' + sanitize(pr.unit) : ''}</span>` : '';

      card.innerHTML = `
        <div class="card-inner">
          <div class="exercise-icon">${ex.icon}</div>
          <div class="exercise-info">
            <div class="exercise-name">${sanitize(ex.name)}${prBadgeHtml}</div>
            <div class="exercise-meta">${metaHtml}</div>
          </div>
          <div class="exercise-sets">${dotsHtml}</div>
          ${actionBtnHtml}
        </div>
      `;

      // Long-press to show options menu
      let longPressTimer = null;
      let longPressFired = false;
      const inner = card.querySelector('.card-inner');
      inner.addEventListener('touchstart', (e) => {
        longPressFired = false;
        longPressTimer = setTimeout(() => {
          longPressFired = true;
          showExerciseOptions(ex.id, activeGroup);
        }, 500);
      }, { passive: true });
      inner.addEventListener('touchend', () => { clearTimeout(longPressTimer); }, { passive: true });
      inner.addEventListener('touchmove', () => { clearTimeout(longPressTimer); }, { passive: true });

      // Tap on card body to log 1 set
      card.querySelector('.card-inner').addEventListener('click', (e) => {
        if (longPressFired) return;
        if (e.target.closest('.card-action-btn')) return;
        logExercise(ex.id);
        showToast(`+1 set ${sanitize(ex.name)}`);
      });

      // Tap action button: mark push if in push window, otherwise remove last set
      const actionBtn = card.querySelector('.card-action-btn');
      if (actionBtn) {
        actionBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (hasPushWindow) {
            markLastSetAsPush(ex.id);
          } else {
            removeLastTodaySet(ex.id);
          }
        });
      }

      container.appendChild(card);

      // Animate entrance based on group
      animateCardIn(card, activeGroup, idx);
      idx++;
    }

    // "Add Exercise" card at the bottom
    const addCard = document.createElement('div');
    addCard.className = `exercise-card exercise-card-add group-${activeGroup}`;
    addCard.innerHTML = `
      <div class="exercise-icon">➕</div>
      <div class="exercise-info">
        <div class="exercise-name" style="color:var(--text-dim)">Add Exercise</div>
      </div>
    `;
    addCard.addEventListener('click', () => {
      promptAddExercise(activeGroup);
    });
    container.appendChild(addCard);
    animateCardIn(addCard, activeGroup, idx);
  }

  // Per-group card entrance animations — each group has a unique style
  const GROUP_ANIMATIONS = {
    back: (card, i) => {
      // Cascade down
      card.style.opacity = '0';
      card.style.transform = 'translateY(-30px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 60);
    },
    shoulders: (card, i) => {
      // Fan out from center
      const dir = i % 2 === 0 ? -1 : 1;
      card.style.opacity = '0';
      card.style.transform = `translateX(${dir * 60}px) rotate(${dir * 8}deg)`;
      setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateX(0) rotate(0deg)';
      }, i * 70);
    },
    chest: (card, i) => {
      // Scale up with bounce
      card.style.opacity = '0';
      card.style.transform = 'scale(0.3)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.34, 1.8, 0.64, 1)';
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
      }, i * 80);
    },
    legs: (card, i) => {
      // Slide up from bottom
      card.style.opacity = '0';
      card.style.transform = 'translateY(80px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.35s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 55);
    },
    arms: (card, i) => {
      // Flip in from side
      card.style.opacity = '0';
      card.style.transform = 'perspective(600px) rotateY(90deg)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
        card.style.opacity = '1';
        card.style.transform = 'perspective(600px) rotateY(0deg)';
      }, i * 75);
    },
    cardio: (card, i) => {
      // Elastic drop from above
      card.style.opacity = '0';
      card.style.transform = 'translateY(-100px) scaleY(0.4)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.3s ease, transform 0.6s cubic-bezier(0.22, 1.5, 0.36, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0) scaleY(1)';
      }, i * 100);
    },
  };

  function animateCardIn(card, groupKey, index) {
    if (skipAnimation) return;
    const anim = GROUP_ANIMATIONS[groupKey];
    if (anim) anim(card, index);
  }

  // ===== Exercise Options Menu =====
  function showExerciseOptions(exerciseId, groupKey) {
    const ex = findExercise(exerciseId);
    if (!ex) return;
    haptic([30]);

    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    const pr = data.personalRecords && data.personalRecords[exerciseId];
    const prDisplay = pr ? `${sanitize(pr.value)}${pr.unit ? ' ' + sanitize(pr.unit) : ''}` : 'Not set';

    title.textContent = `${ex.icon} ${sanitize(ex.name)}`;
    body.innerHTML = `
      <div class="options-menu">
        <button class="options-btn" id="opt-edit">
          <span class="options-icon">✏️</span>
          <span class="options-label">Edit</span>
          <span class="options-desc">Change name or emoji</span>
        </button>
        <button class="options-btn" id="opt-pr">
          <span class="options-icon">🏅</span>
          <span class="options-label">Personal Record</span>
          <span class="options-desc">${prDisplay}</span>
        </button>
        <button class="options-btn options-btn-danger" id="opt-delete">
          <span class="options-icon">🗑️</span>
          <span class="options-label">Delete</span>
          <span class="options-desc">Remove this exercise</span>
        </button>
      </div>
    `;

    modal.classList.remove('hidden');

    document.getElementById('opt-edit').addEventListener('click', () => {
      closeModal();
      promptEditExercise(exerciseId, groupKey);
    });

    document.getElementById('opt-pr').addEventListener('click', () => {
      closeModal();
      promptSetPR(exerciseId);
    });

    document.getElementById('opt-delete').addEventListener('click', () => {
      closeModal();
      deleteExercise(exerciseId, groupKey);
    });
  }

  function promptSetPR(exerciseId) {
    const ex = findExercise(exerciseId);
    if (!ex) return;

    if (!data.personalRecords) data.personalRecords = {};
    const current = data.personalRecords[exerciseId];

    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    // Build history list if there are previous PRs
    let historyHtml = '';
    if (current && current.history && current.history.length > 0) {
      const items = current.history.map(h =>
        `<div class="pr-history-item"><span>${sanitize(h.value)}${h.unit ? ' ' + sanitize(h.unit) : ''}</span><span class="pr-history-date">${h.date}</span></div>`
      ).join('');
      historyHtml = `<div class="pr-history"><div class="pr-history-title">PR History</div>${items}</div>`;
    }

    title.textContent = `🏅 PR — ${sanitize(ex.name)}`;
    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;gap:10px">
          <input type="text" id="pr-value" value="${current ? sanitize(current.value) : ''}" placeholder="e.g. 225"
            style="background:var(--bg);border:2px solid var(--surface2);border-radius:10px;padding:12px 14px;color:var(--text);font-size:1rem;outline:none;flex:1;box-sizing:border-box;" />
          <input type="text" id="pr-unit" value="${current ? sanitize(current.unit || '') : ''}" placeholder="lbs"
            maxlength="10"
            style="background:var(--bg);border:2px solid var(--surface2);border-radius:10px;padding:12px 14px;color:var(--text);font-size:1rem;outline:none;width:70px;box-sizing:border-box;" />
        </div>
        <button class="btn btn-primary" id="pr-save">Save PR</button>
        ${historyHtml}
      </div>
    `;

    modal.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('pr-value').focus();

    // Auto-select on focus
    document.getElementById('pr-value').addEventListener('focus', function () { this.select(); });

    const save = () => {
      const value = document.getElementById('pr-value').value.trim();
      const unit = document.getElementById('pr-unit').value.trim();

      // Empty value = clear the PR
      if (!value) {
        delete data.personalRecords[exerciseId];
        saveData();
        closeModal();
        renderAll();
        showToast('PR removed');
        return;
      }

      const today = todayStr();
      const oldPR = data.personalRecords[exerciseId];

      // Build history: keep previous PR if it was different
      let history = (oldPR && oldPR.history) ? [...oldPR.history] : [];
      if (oldPR && oldPR.value && (oldPR.value !== value || (oldPR.unit || '') !== unit)) {
        history.push({ value: oldPR.value, unit: oldPR.unit || '', date: oldPR.date });
      }

      data.personalRecords[exerciseId] = { value, unit, date: today, history };
      saveData();
      closeModal();
      renderAll();
      showToast(`PR saved: ${value}${unit ? ' ' + unit : ''}`);
    };

    document.getElementById('pr-save').addEventListener('click', save);
    document.getElementById('pr-value').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
    });
    document.getElementById('pr-unit').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
    });
  }

  // ===== Exercise Management (custom, edit, hide) =====
  function promptEditExercise(exerciseId, groupKey) {
    const ex = findExercise(exerciseId);
    if (!ex) return;

    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    title.textContent = 'Edit Exercise';
    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="edit-emoji-row">
          <input type="text" id="edit-exercise-icon" value="${ex.icon}" maxlength="4"
            class="edit-emoji-input" />
          <input type="text" id="edit-exercise-name" value="${sanitize(ex.name)}" maxlength="40" placeholder="Exercise name"
            style="background:var(--bg);border:2px solid var(--surface2);border-radius:10px;padding:12px 14px;color:var(--text);font-size:1rem;outline:none;flex:1;box-sizing:border-box;" />
        </div>
        <button class="btn btn-primary" id="edit-exercise-save">Save</button>
      </div>
    `;

    modal.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('edit-exercise-name').focus();

    // Auto-select emoji on focus so tapping it lets user type a replacement directly
    document.getElementById('edit-exercise-icon').addEventListener('focus', function () {
      this.select();
    });

    const save = () => {
      const newName = document.getElementById('edit-exercise-name').value.trim();
      const newIcon = document.getElementById('edit-exercise-icon').value.trim();
      if (!newName) return;
      data.exerciseOverrides[exerciseId] = {
        name: newName,
        icon: newIcon || ex.icon,
      };
      // Also update custom exercise source object if applicable
      if (exerciseId.startsWith('custom_') && data.customExercises[groupKey]) {
        const src = data.customExercises[groupKey].find(e => e.id === exerciseId);
        if (src) { src.name = newName; src.icon = newIcon || src.icon; }
      }
      saveData();
      closeModal();
      renderAll();
      showToast(`Updated ${sanitize(newName)}`);
    };

    document.getElementById('edit-exercise-save').addEventListener('click', save);
    document.getElementById('edit-exercise-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
    });
    document.getElementById('edit-exercise-icon').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
    });
  }

  function promptAddExercise(groupKey) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    // Find hidden built-in exercises that can be restored
    const hidden = data.hiddenExercises[groupKey] || [];
    const restoreList = MUSCLE_GROUPS[groupKey].exercises
      .filter(e => hidden.includes(e.id))
      .map(applyOverride);

    let restoreHtml = '';
    if (restoreList.length) {
      restoreHtml = `
        <div class="restore-divider">Restore removed</div>
        <div class="restore-list">
          ${restoreList.map(e => `
            <button class="restore-btn" data-id="${e.id}">
              <span>${e.icon}</span> ${sanitize(e.name)}
            </button>
          `).join('')}
        </div>
      `;
    }

    title.textContent = 'Add Exercise';
    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <input type="text" id="new-exercise-input" placeholder="Exercise name" maxlength="40"
          style="background:var(--bg);border:2px solid var(--surface2);border-radius:10px;padding:12px 14px;color:var(--text);font-size:1rem;outline:none;width:100%;box-sizing:border-box;"
        />
        <button class="btn btn-primary" id="add-exercise-confirm">Add</button>
        ${restoreHtml}
      </div>
    `;

    modal.classList.remove('hidden');

    const input = document.getElementById('new-exercise-input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    input.focus();

    const confirm = () => {
      const name = input.value.trim();
      if (!name) return;
      addCustomExercise(groupKey, name);
      closeModal();
      renderAll();
      showToast(`Added ${sanitize(name)}`);
    };

    document.getElementById('add-exercise-confirm').addEventListener('click', confirm);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirm();
    });

    // Restore hidden exercise buttons
    body.querySelectorAll('.restore-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        data.hiddenExercises[groupKey] = (data.hiddenExercises[groupKey] || []).filter(h => h !== id);
        saveData();
        closeModal();
        renderAll();
        const ex = findExercise(id);
        showToast(`Restored ${ex ? sanitize(ex.name) : 'exercise'}`);
      });
    });
  }

  // ===== Celebrations (milestones, group goals, cardio) =====

  function celebrateGroupGoal(groupKey) {
    haptic([100, 60, 100, 60, 200]);

    const group = MUSCLE_GROUPS[groupKey];
    const color = GROUP_COLORS[groupKey] || '#6c63ff';
    const overlay = document.createElement('div');
    overlay.className = 'celebrate-overlay';

    // Gold shimmer banner with group name
    const banner = document.createElement('div');
    banner.className = 'celebrate-banner banner-gold banner-glow';
    banner.textContent = `${group.icon} ${group.label} Goal Reached!`;
    overlay.appendChild(banner);

    // Ring burst — colored ring expanding outward
    const ring = document.createElement('div');
    ring.className = 'goal-ring';
    ring.style.borderColor = color;
    ring.style.boxShadow = `0 0 40px ${color}, 0 0 80px ${color}`;
    overlay.appendChild(ring);

    // Group-colored starburst particles
    const emojis = ['\u2b50', '\u2728', '\ud83c\udf1f', '\u26a1', group.icon, '\ud83c\udfc6'];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('div');
      p.className = 'starburst';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const angle = (Math.PI * 2 * i) / 60 + (Math.random() - 0.5) * 0.4;
      const dist = 140 + Math.random() * 300;
      p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
      p.style.animationDelay = Math.random() * 0.4 + 's';
      p.style.animationDuration = (0.9 + Math.random() * 0.7) + 's';
      p.style.fontSize = (20 + Math.random() * 22) + 'px';
      overlay.appendChild(p);
    }

    // Group-colored confetti rain
    const shapes = ['\u25cf', '\u25a0', '\u2605', '\u25c6'];
    for (let i = 0; i < 50; i++) {
      const p = document.createElement('div');
      p.className = 'confetti';
      p.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      p.style.color = color;
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 0.8 + 's';
      p.style.animationDuration = (1.8 + Math.random() * 1.8) + 's';
      p.style.fontSize = (14 + Math.random() * 20) + 'px';
      overlay.appendChild(p);
    }

    // Screen shake
    document.getElementById('app').classList.add('screen-shake');
    setTimeout(() => document.getElementById('app').classList.remove('screen-shake'), 600);

    document.getElementById('app').appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add('celebrate-fade');
      setTimeout(() => overlay.remove(), 500);
    }, 3800);
  }

  function celebrateCardio() {
    haptic([60, 40, 80]);

    const overlay = document.createElement('div');
    overlay.className = 'celebrate-overlay';

    // Banner
    const banner = document.createElement('div');
    banner.className = 'celebrate-banner';
    banner.textContent = 'Cardio Logged \ud83c\udfc3';
    overlay.appendChild(banner);

    // Swoosh trail particles — streak horizontally
    const emojis = ['\ud83c\udfc3', '\ud83d\udca8', '\u26a1', '\ud83d\udd25', '\ud83c\udf1f', '\u2728'];
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('div');
      p.className = 'swoosh';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const yOffset = (Math.random() - 0.5) * 280;
      p.style.setProperty('--y-offset', yOffset + 'px');
      p.style.animationDelay = (i * 0.05) + 's';
      p.style.fontSize = (18 + Math.random() * 16) + 'px';
      overlay.appendChild(p);
    }

    document.getElementById('app').appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add('celebrate-fade');
      setTimeout(() => overlay.remove(), 500);
    }, 2400);
  }

  function checkMilestone(dailySets) {
    // Find the highest milestone hit
    let milestone = null;
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (dailySets >= MILESTONES[i].sets) { milestone = MILESTONES[i]; break; }
    }
    if (!milestone) return;
    if (milestone.sets <= lastCelebratedMilestone) return;
    lastCelebratedMilestone = milestone.sets;
    celebrateMilestone(milestone);
  }

  function haptic(pattern) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    } else {
      // iOS Safari doesn't support vibrate — flash the screen as tactile substitute
      const flash = document.createElement('div');
      flash.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.12);z-index:9999;pointer-events:none;transition:opacity 0.15s';
      document.body.appendChild(flash);
      requestAnimationFrame(() => { flash.style.opacity = '0'; });
      setTimeout(() => flash.remove(), 200);
    }
  }

  function celebrateMilestone(ms) {
    haptic(ms.vibrate);

    const tierIndex = MILESTONES.indexOf(ms);
    const overlay = document.createElement('div');
    overlay.className = 'celebrate-overlay';

    // Banner
    const banner = document.createElement('div');
    banner.className = 'celebrate-banner';
    if (tierIndex >= 4) banner.classList.add('banner-glow');
    if (tierIndex >= 5) banner.classList.add('banner-gold');
    banner.textContent = `${ms.label} ${ms.emoji}`;
    overlay.appendChild(banner);

    // Particles — scale up with tier
    const starEmojis = ['⭐', '💪', '🔥', '⚡', '🌟', '🏆', '🚀', '🎉', '✨', '💥'];
    const colors = ['#4ade80', '#6c63ff', '#fbbf24', '#ff6b81', '#63b3ff', '#ce82ff', '#ff9f43', '#2ed573'];

    if (tierIndex <= 1) {
      // Small: sparks popping up from bottom center
      for (let i = 0; i < ms.particles; i++) {
        const p = document.createElement('div');
        p.className = 'spark';
        p.textContent = starEmojis[Math.floor(Math.random() * starEmojis.length)];
        const spread = (Math.random() - 0.5) * 340;
        const rise = 120 + Math.random() * 200;
        p.style.setProperty('--sx', spread + 'px');
        p.style.setProperty('--sy', -rise + 'px');
        p.style.animationDelay = Math.random() * 0.3 + 's';
        p.style.fontSize = (16 + Math.random() * 14) + 'px';
        overlay.appendChild(p);
      }
    } else if (tierIndex <= 3) {
      // Medium: starburst from center
      for (let i = 0; i < ms.particles; i++) {
        const p = document.createElement('div');
        p.className = 'starburst';
        p.textContent = starEmojis[Math.floor(Math.random() * starEmojis.length)];
        const angle = (Math.PI * 2 * i) / ms.particles + (Math.random() - 0.5) * 0.5;
        const dist = 120 + Math.random() * 260;
        p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        p.style.animationDelay = Math.random() * 0.4 + 's';
        p.style.animationDuration = (0.8 + Math.random() * 0.7) + 's';
        p.style.fontSize = (18 + Math.random() * 18) + 'px';
        overlay.appendChild(p);
      }
      // Screen shake for Beast Mode
      if (tierIndex === 3) {
        document.getElementById('app').classList.add('screen-shake');
        setTimeout(() => document.getElementById('app').classList.remove('screen-shake'), 500);
      }
    } else {
      // Big: confetti rain + starburst combined
      const confettiCount = Math.floor(ms.particles * 0.5);
      const burstCount = ms.particles - confettiCount;
      const shapes = ['●', '■', '▲', '★', '◆'];
      for (let i = 0; i < confettiCount; i++) {
        const p = document.createElement('div');
        p.className = 'confetti';
        p.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        p.style.color = colors[Math.floor(Math.random() * colors.length)];
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 0.7 + 's';
        p.style.animationDuration = (1.8 + Math.random() * 1.8) + 's';
        p.style.fontSize = (14 + Math.random() * 22) + 'px';
        overlay.appendChild(p);
      }
      for (let i = 0; i < burstCount; i++) {
        const p = document.createElement('div');
        p.className = 'starburst';
        p.textContent = starEmojis[Math.floor(Math.random() * starEmojis.length)];
        const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.4;
        const dist = 160 + Math.random() * 280;
        p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        p.style.animationDelay = Math.random() * 0.4 + 's';
        p.style.animationDuration = (0.9 + Math.random() * 0.7) + 's';
        p.style.fontSize = (20 + Math.random() * 20) + 'px';
        overlay.appendChild(p);
      }
      // Screen shake for top tiers
      document.getElementById('app').classList.add('screen-shake');
      setTimeout(() => document.getElementById('app').classList.remove('screen-shake'), 600);
    }

    document.getElementById('app').appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add('celebrate-fade');
      setTimeout(() => overlay.remove(), 500);
    }, ms.duration);
  }

  // ===== Streak Badge =====
  function initStreakBadge() {
    const badge = document.createElement('div');
    badge.id = 'streak-badge';
    badge.className = 'streak-badge hidden';
    badge.innerHTML = '<span class="streak-count"></span><span class="streak-flame">⚡</span>';
    document.getElementById('header').appendChild(badge);
    // Init on load
    const currentSets = getDailySetCount();
    if (currentSets > 0) updateStreakBadge(currentSets);
  }

  function updateStreakBadge(sets) {
    const badge = document.getElementById('streak-badge');
    if (!badge) return;
    if (sets <= 0) { badge.classList.add('hidden'); return; }

    badge.classList.remove('hidden');
    badge.querySelector('.streak-count').textContent = sets;

    // Color tier: gradual progression, most change happens by 15 sets
    let tier;
    if (sets >= 15) tier = 5;
    else if (sets >= 12) tier = 4;
    else if (sets >= 9) tier = 3;
    else if (sets >= 6) tier = 2;
    else if (sets >= 3) tier = 1;
    else tier = 0;
    badge.dataset.tier = tier;

    // Bounce animation
    badge.classList.remove('streak-bump');
    void badge.offsetWidth; // force reflow
    badge.classList.add('streak-bump');
  }

  // ===== Modal =====
  function closeModal() {
    document.getElementById('modal').classList.add('hidden');
  }

  function initModal() {
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  }
  // ===== UI Feedback =====
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add('hidden'), 1500);
  }

  // ===== Security =====
  // Sanitize user-provided strings before inserting into the DOM
  function sanitize(str) {
    _sanitizeEl.textContent = str;
    return _sanitizeEl.innerHTML;
  }

  // ===== Group Navigation & Animations =====
  function switchToGroup(groupKey) {
    const card = document.getElementById('summary');
    const container = document.getElementById('summary-bars');
    const rows = container.querySelectorAll('.summary-row');

    if (activeGroup === groupKey) {
      // Toggle off — collapse exercises, then expand all rows back in
      collapseExercises();
      activeGroup = null;
      card.classList.remove('card-compact');
      renderSummary();
      // Animate new rows in with stagger
      const newRows = container.querySelectorAll('.summary-row');
      newRows.forEach((row, i) => {
        row.style.opacity = '0';
        row.style.maxHeight = '0';
        row.style.padding = '0 10px';
        row.style.transition = 'none';
        requestAnimationFrame(() => {
          row.style.transition = 'opacity 0.3s ease, max-height 0.35s ease, padding 0.35s ease';
          row.style.transitionDelay = (i * 40) + 'ms';
          row.style.opacity = '1';
          row.style.maxHeight = '60px';
          row.style.padding = '10px 10px';
        });
      });
      return;
    }

    // Selecting a group — animate non-active rows out, then render
    const outRows = [];
    rows.forEach(row => {
      if (row.dataset.group !== groupKey) outRows.push(row);
    });

    if (outRows.length === 0) {
      // Already showing single group, just re-render
      activeGroup = groupKey;
      card.classList.add('card-compact');
      renderExercises();
      renderSummary();
      return;
    }

    // Animate departing rows
    card.classList.add('card-compact');
    outRows.forEach(row => {
      row.style.transition = 'opacity 0.25s ease, max-height 0.3s ease, padding 0.3s ease';
      row.style.opacity = '0';
      row.style.maxHeight = '0';
      row.style.padding = '0 10px';
    });

    // After animation, render the selected state
    setTimeout(() => {
      activeGroup = groupKey;
      renderExercises();
      renderSummary();

      // Pulse the active row in
      const activeRow = container.querySelector('.summary-row.active');
      if (activeRow) {
        activeRow.style.opacity = '0';
        activeRow.style.transform = 'scale(0.95)';
        activeRow.style.transition = 'none';
        requestAnimationFrame(() => {
          activeRow.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          activeRow.style.opacity = '1';
          activeRow.style.transform = 'scale(1)';
        });
      }
    }, 280);
  }

  function collapseExercises() {
    const container = document.getElementById('exercises');
    const cards = container.querySelectorAll('.exercise-card');
    cards.forEach((card, i) => {
      card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.9)';
    });
    setTimeout(() => { container.innerHTML = ''; }, 250);
  }

  // ===== Init =====
  function init() {
    initModal();
    initStreakBadge();

    // Set milestone baseline so page load doesn't re-trigger celebrations
    const initSets = getDailySetCount();
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (initSets >= MILESTONES[i].sets) { lastCelebratedMilestone = MILESTONES[i].sets; break; }
    }
    // Mark groups that already hit their goal
    for (const key of Object.keys(MUSCLE_GROUPS)) {
      const vol = getGroupVolume14Days(key);
      const target = getTarget(key);
      if (target > 0 && vol >= target) celebratedGoals.add(key);
    }
    // Suppress duplicate cardio celebration if already logged today
    cardioCelebratedToday = getDailyCardioCount() > 0;
    renderDate();
    renderSummary();

    // Tap anywhere on the summary card (except bars/buttons) to deselect
    document.getElementById('summary').addEventListener('click', (e) => {
      if (e.target.closest('.summary-row') || e.target.closest('.target-stepper-row')) return;
      if (activeGroup) {
        collapseExercises();
        activeGroup = null;
        document.getElementById('summary').classList.remove('card-compact');
        renderSummary();
      }
    });

    // Settings gear
    document.getElementById('settings-btn').addEventListener('click', openSettings);

    // Help button
    document.getElementById('help-btn').addEventListener('click', startTutorial);
  }

  // ===== Settings / Import / Export =====
  function openSettings() {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    title.textContent = 'Settings';

    const totalLogs = Object.values(data.logs).reduce((sum, arr) => sum + arr.length, 0);

    body.innerHTML = `
      <div class="settings-section">
        <p style="color:var(--text-dim);font-size:0.85rem;margin-bottom:16px;">${totalLogs} total sets logged</p>
        <button class="btn btn-primary settings-action" id="edit-history-btn">Edit History</button>
        <button class="btn btn-primary settings-action" id="export-btn">Download Backup</button>
        <button class="btn btn-primary settings-action" id="email-btn">Email Backup</button>
        <button class="btn btn-primary settings-action" id="import-btn">Import Backup</button>
        <button class="btn btn-danger settings-action" id="clear-all-btn">Clear All Data</button>
        <input type="file" id="import-file-input" accept=".json" style="display:none" />
      </div>
    `;

    document.getElementById('edit-history-btn').addEventListener('click', () => {
      openHistoryEditor();
    });
    document.getElementById('export-btn').addEventListener('click', exportData);
    document.getElementById('email-btn').addEventListener('click', emailBackup);
    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });
    document.getElementById('import-file-input').addEventListener('change', importData);
    document.getElementById('clear-all-btn').addEventListener('click', () => {
      if (confirm('Delete ALL workout data? This cannot be undone.')) {
        data = { logs: {}, targets: {}, customExercises: {}, exerciseOverrides: {}, hiddenExercises: {}, personalRecords: {} };
        activeGroup = null;
        lastCelebratedMilestone = 0;
        saveData();
        closeModal();
        renderAll();
        showToast('All data cleared');
      }
    });

    modal.classList.remove('hidden');
  }

  function exportData() {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workout-data-' + todayStr() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported');
  }

  function emailBackup() {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    title.textContent = 'Email Backup';
    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <p style="color:var(--text-dim);font-size:0.85rem;">Enter your email and we'll open your mail app with your workout data attached as text.</p>
        <input type="email" id="email-input" placeholder="your@email.com"
          style="background:var(--bg);border:2px solid var(--surface2);border-radius:10px;padding:12px 14px;color:var(--text);font-size:1rem;outline:none;width:100%;box-sizing:border-box;"
        />
        <button class="btn btn-primary" id="email-send-btn">Send</button>
      </div>
    `;
    modal.classList.remove('hidden');

    const input = document.getElementById('email-input');
    input.focus();

    const send = () => {
      const email = input.value.trim();
      if (!email) return;
      const json = JSON.stringify(data);
      const subject = encodeURIComponent('Workout Tracker Backup - ' + todayStr());
      const bodyText = encodeURIComponent('Paste this into a .json file and use Import Backup to restore:\n\n' + json);
      window.location.href = 'mailto:' + encodeURIComponent(email) + '?subject=' + subject + '&body=' + bodyText;
      showToast('Opening mail app...');
    };

    document.getElementById('email-send-btn').addEventListener('click', send);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') send();
    });
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!imported.logs || typeof imported.logs !== 'object') {
          showToast('Invalid backup file');
          return;
        }
        if (confirm('Replace all current data with imported backup?')) {
          data = imported;
          if (!data.targets) data.targets = {};
          if (!data.customExercises) data.customExercises = {};
          if (!data.exerciseOverrides) data.exerciseOverrides = {};
          if (!data.hiddenExercises) data.hiddenExercises = {};
          if (!data.personalRecords) data.personalRecords = {};
          // Re-register custom exercises in lookup map
          for (const [key, exercises] of Object.entries(data.customExercises)) {
            for (const ex of exercises) {
              EXERCISE_GROUP_MAP[ex.id] = key;
            }
          }
          saveData();
          closeModal();
          renderAll();
          showToast('Data imported successfully');
        }
      } catch (err) {
        showToast('Failed to read file');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be selected again
    e.target.value = '';
  }

  // ===== History Editor =====
  function openHistoryEditor(selectedGroup) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    title.textContent = 'Edit History (Sets Estimated)';

    // Build 14 days (today + 13 prior)
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      days.push({
        date: `${y}-${m}-${day}`,
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        num: d.getDate()
      });
    }

    // Group selector tabs
    const groupKeys = Object.keys(MUSCLE_GROUPS);
    const currentGroup = selectedGroup || groupKeys[0];

    let tabsHtml = '<div class="history-tabs">';
    const topRow = groupKeys.slice(0, 3);
    const bottomRow = groupKeys.slice(3);
    for (const key of topRow) {
      const g = MUSCLE_GROUPS[key];
      tabsHtml += `<button class="history-tab${key === currentGroup ? ' active' : ''}" data-group="${key}">${g.label}</button>`;
    }
    tabsHtml += '</div><div class="history-tabs">';
    for (const key of bottomRow) {
      const g = MUSCLE_GROUPS[key];
      tabsHtml += `<button class="history-tab${key === currentGroup ? ' active' : ''}" data-group="${key}">${g.label}</button>`;
    }
    tabsHtml += '</div>';

    // Day header cells (flat — direct children of the grid scroll container)
    let headerHtml = '<div class="history-grid-name history-grid-corner"></div>';
    for (const day of days) {
      headerHtml += `<div class="history-grid-day"><span>${day.label}</span><span>${day.num}</span></div>`;
    }

    const isCardio = currentGroup === 'cardio';
    const defaultSets = isCardio ? 1 : 3;

    // Exercise rows for current group (flat — no row wrappers)
    const exercises = MUSCLE_GROUPS[currentGroup].exercises;
    let rowsHtml = '';
    for (const ex of exercises) {
      rowsHtml += `<div class="history-grid-name">${sanitize(ex.name)}</div>`;
      for (const day of days) {
        const logs = (data.logs[ex.id] || []).filter(l => l.date === day.date);
        const count = logs.length;
        rowsHtml += `<div class="history-grid-cell${count > 0 ? ' checked' : ''}" data-exercise="${ex.id}" data-date="${day.date}" data-count="${count}">`;
        rowsHtml += count > 0 ? '✓' : '';
        rowsHtml += '</div>';
      }
    }

    body.innerHTML = `
      ${tabsHtml}
      <div class="history-grid-scroll">
        ${headerHtml}
        ${rowsHtml}
      </div>
      <div style="margin-top:12px;text-align:center;">
        <button class="btn btn-primary" id="history-done-btn" style="flex:none;padding:10px 32px;">Done</button>
      </div>
    `;

    // Tab switching
    body.querySelectorAll('.history-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        openHistoryEditor(tab.dataset.group);
      });
    });

    // Cell tapping — toggle on/off
    body.querySelectorAll('.history-grid-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const exId = cell.dataset.exercise;
        const date = cell.dataset.date;
        let current = parseInt(cell.dataset.count, 10);

        if (current > 0) {
          // Remove all logs for this exercise on this date
          if (data.logs[exId]) {
            data.logs[exId] = data.logs[exId].filter(l => l.date !== date);
          }
          current = 0;
        } else {
          // Add default sets
          if (!data.logs[exId]) data.logs[exId] = [];
          for (let s = 0; s < defaultSets; s++) {
            data.logs[exId].push({ date, ts: parseDate(date).getTime() + s });
          }
          current = defaultSets;
        }

        saveData();
        cell.dataset.count = current;
        cell.textContent = current > 0 ? '✓' : '';
        cell.classList.toggle('checked', current > 0);
      });
    });

    // Done button
    document.getElementById('history-done-btn').addEventListener('click', () => {
      closeModal();
      renderAll();
    });

    modal.classList.remove('hidden');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ===== Tutorial Walkthrough =====
  const TUTORIAL_STEPS = [
    {
      target: '#summary',
      title: '14-Day Volume',
      text: 'Each bar tracks your sets over the last 14 days, colored by muscle group.',
      position: 'below',
    },
    {
      target: '.summary-row.focus-glow',
      title: 'Focus Recommendations',
      text: '🎯 and a glowing border highlight the groups that need your attention most.',
      position: 'below',
      fallback: true,
      fallbackTarget: '.summary-row',
    },
    {
      target: '.summary-row',
      title: 'Select a Group',
      text: 'Tap a muscle group to see its exercises.',
      position: 'below',
      action: 'openGroup',
    },
    {
      target: '.target-stepper-row',
      title: 'Adjust Your Goal',
      text: 'Use +/− to change the 14-day set target.',
      position: 'below',
      fallback: true,
    },
    {
      target: '.exercise-card',
      title: 'Log a Set',
      text: 'Tap any exercise card to add 1 set.',
      position: 'above',
      fallback: true,
    },
    {
      target: '.card-action-btn',
      title: 'Remove / Heavy Set',
      text: 'Tap − to undo your last set. After logging, it briefly shows 🔥 — tap it to mark as extra effort.',
      position: 'above',
      fallback: true,
    },
    {
      target: '.exercise-card',
      title: 'Exercise Options',
      text: 'Long-press any exercise for options: Edit, Delete, or set a Personal Record.',
      position: 'above',
      fallback: true,
    },
    {
      target: '.exercise-card-add',
      title: 'Custom Exercises',
      text: 'Add your own exercises to any group.',
      position: 'above',
      fallback: true,
    },
    {
      target: '#settings-btn',
      title: 'Settings ⚙️',
      text: 'Edit history, backup, import, or clear data.',
      position: 'below',
    },
    {
      target: '#help-btn',
      title: 'You\'re All Set! 💪',
      text: 'Tap ❓ anytime to replay this guide.',
      position: 'below',
    },
  ];

  let tutorialStep = 0;
  let tutorialOverlay = null;

  function startTutorial() {
    // Start from overview — deselect any active group
    if (activeGroup) {
      activeGroup = null;
      document.getElementById('summary').classList.remove('card-compact');
      renderSummary();
      document.getElementById('exercises').innerHTML = '';
    }
    tutorialStep = 0;
    showTutorialStep();
  }

  function showTutorialStep() {
    // Clean up previous overlay
    if (tutorialOverlay) tutorialOverlay.remove();
    if (tutorialStep >= TUTORIAL_STEPS.length) {
      endTutorial();
      return;
    }

    const step = TUTORIAL_STEPS[tutorialStep];
    // Action: open a group for exercise-related steps
    if (step.action === 'openGroup' && !activeGroup) {
      activeGroup = 'back';
      document.getElementById('summary').classList.add('card-compact');
      renderSummary();
      renderExercises();
    }

    let targetEl = document.querySelector(step.target);

    // Try fallback selector if primary doesn't exist
    if (!targetEl && step.fallbackTarget) {
      targetEl = document.querySelector(step.fallbackTarget);
    }

    // If target doesn't exist (e.g. no exercises rendered), skip
    if (!targetEl && step.fallback) {
      tutorialStep++;
      showTutorialStep();
      return;
    }
    if (!targetEl) targetEl = document.getElementById('app');

    // Ensure target is visible in the viewport
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Small delay to let scroll settle before measuring
    requestAnimationFrame(() => { positionTutorial(targetEl, step); });
  }

  function positionTutorial(targetEl, step) {
    const rect = targetEl.getBoundingClientRect();
    const pad = 8;

    // Build overlay
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';

    // Transparent backdrop (click handler only)
    const backdrop = document.createElement('div');
    backdrop.className = 'tutorial-backdrop';
    backdrop.style.background = 'transparent';
    overlay.appendChild(backdrop);

    // Spotlight cutout
    const spotlight = document.createElement('div');
    spotlight.className = 'tutorial-spotlight';
    spotlight.style.top = (rect.top - pad) + 'px';
    spotlight.style.left = (rect.left - pad) + 'px';
    spotlight.style.width = (rect.width + pad * 2) + 'px';
    spotlight.style.height = (rect.height + pad * 2) + 'px';
    overlay.appendChild(spotlight);

    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tutorial-tooltip';

    // Progress dots
    let dotsHtml = '<div class="tutorial-dots">';
    for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
      dotsHtml += `<div class="tutorial-dot${i === tutorialStep ? ' active' : ''}"></div>`;
    }
    dotsHtml += '</div>';

    const isLast = tutorialStep === TUTORIAL_STEPS.length - 1;
    tooltip.innerHTML = `
      <div class="tutorial-title">${step.title}</div>
      <div class="tutorial-text">${step.text}</div>
      <div class="tutorial-footer">
        ${dotsHtml}
        <div style="display:flex;gap:10px;align-items:center">
          ${!isLast ? '<button class="tutorial-skip">Skip</button>' : ''}
          <button class="tutorial-next">${isLast ? 'Done' : 'Next'}</button>
        </div>
      </div>
    `;

    // Position tooltip
    overlay.appendChild(tooltip);
    document.body.appendChild(overlay);
    tutorialOverlay = overlay;

    // Calculate position after it's in DOM
    const tooltipRect = tooltip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let tooltipLeft = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipRect.width / 2, vw - tooltipRect.width - 16));

    let tooltipTop;
    if (step.position === 'below') {
      tooltipTop = rect.bottom + pad + 12;
      // If it would overflow the bottom, flip above
      if (tooltipTop + tooltipRect.height > vh - 16) {
        tooltipTop = rect.top - pad - 12 - tooltipRect.height;
      }
    } else {
      tooltipTop = rect.top - pad - 12 - tooltipRect.height;
      // If it would overflow the top, flip below
      if (tooltipTop < 16) {
        tooltipTop = rect.bottom + pad + 12;
      }
    }
    // Final clamp to viewport
    tooltipTop = Math.max(16, Math.min(tooltipTop, vh - tooltipRect.height - 16));
    tooltip.style.top = tooltipTop + 'px';
    tooltip.style.left = tooltipLeft + 'px';

    // Event handlers
    tooltip.querySelector('.tutorial-next').addEventListener('click', (e) => {
      e.stopPropagation();
      tutorialStep++;
      showTutorialStep();
    });

    const skipBtn = tooltip.querySelector('.tutorial-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        endTutorial();
      });
    }

    // Tap backdrop to advance
    backdrop.addEventListener('click', () => {
      tutorialStep++;
      showTutorialStep();
    });
  }

  function endTutorial() {
    if (tutorialOverlay) {
      tutorialOverlay.remove();
      tutorialOverlay = null;
    }
    tutorialStep = 0;
    // Return to initial state — deselect group, show overview
    if (activeGroup) {
      activeGroup = null;
      document.getElementById('summary').classList.remove('card-compact');
      renderSummary();
      document.getElementById('exercises').innerHTML = '';
    }
  }
})();
