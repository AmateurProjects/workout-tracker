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

  // ===== State =====
  // Precompute exercise → group lookup
  const EXERCISE_GROUP_MAP = {};
  for (const [key, group] of Object.entries(MUSCLE_GROUPS)) {
    for (const ex of group.exercises) {
      EXERCISE_GROUP_MAP[ex.id] = key;
    }
  }

  let data = loadData();
  // Ensure customExercises exists for older data
  if (!data.customExercises) data.customExercises = {};

  // Also register any saved custom exercises
  for (const [key, exercises] of Object.entries(data.customExercises)) {
    for (const ex of exercises) {
      EXERCISE_GROUP_MAP[ex.id] = key;
    }
  }

  let activeGroup = null;
  let undoTimeout = null;
  let lastAction = null;
  let pushWindow = null; // { exerciseId, ts, timer }
  let cardioCelebrated = false;
  let exerciseCelebrated = false;
  const _sanitizeEl = document.createElement('div');

  // ===== Persistence =====
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load data', e);
    }
    return { logs: {}, targets: {}, customExercises: {} };
    // logs: { [exerciseId]: [ { date: "YYYY-MM-DD" }, ... ] }
    // targets: { [groupKey]: number }
    // customExercises: { [groupKey]: [ { id, name, icon, dots } ] }
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
  function getExerciseLogs(exerciseId) {
    return (data.logs[exerciseId] || []).sort((a, b) => b.date.localeCompare(a.date));
  }

  function getTodayLogs(exerciseId) {
    const today = todayStr();
    return (data.logs[exerciseId] || []).filter(l => l.date === today);
  }

  function getPushStats(exerciseId) {
    const today = todayStr();
    const logs = data.logs[exerciseId] || [];
    // Group by date, only last 30 days
    const byDate = {};
    for (const l of logs) {
      if (daysBetween(l.date, today) <= 30) {
        if (!byDate[l.date]) byDate[l.date] = [];
        byDate[l.date].push(l);
      }
    }
    const dates = Object.keys(byDate).sort().reverse();
    let pushSessions = 0;
    let totalSessions = dates.length;
    let streak = 0;
    let streakBroken = false;
    for (const date of dates) {
      const hasPush = byDate[date].some(l => l.push);
      if (hasPush) pushSessions++;
      if (!streakBroken && hasPush) streak++;
      else streakBroken = true;
    }
    return { pushSessions, totalSessions, streak };
  }

  function getLastDate(exerciseId) {
    const logs = getExerciseLogs(exerciseId);
    return logs.length > 0 ? logs[0].date : null;
  }

  function getGroupVolume14Days(groupKey) {
    const { total } = getGroupStats14Days(groupKey);
    return total;
  }

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

  function getDailyCardioCount() {
    const today = todayStr();
    const cardioIds = MUSCLE_GROUPS.cardio.exercises.map(e => e.id);
    let count = 0;
    for (const id of cardioIds) {
      if ((data.logs[id] || []).some(l => l.date === today)) count++;
    }
    return count;
  }

  // ===== Actions =====
  function logExercise(exerciseId) {
    if (!data.logs[exerciseId]) data.logs[exerciseId] = [];

    // Snapshot before logging
    const groupKey = EXERCISE_GROUP_MAP[exerciseId] || null;
    const volBefore = groupKey ? getGroupVolume14Days(groupKey) : 0;
    const target = groupKey ? getTarget(groupKey) : 0;
    const dailyBefore = getDailySetCount();
    const cardioBefore = getDailyCardioCount();

    const entry = { date: todayStr(), ts: Date.now() };
    data.logs[exerciseId].push(entry);
    saveData();

    // Snapshot after logging
    const volAfter = groupKey ? getGroupVolume14Days(groupKey) : 0;
    const dailyAfter = getDailySetCount();
    const cardioAfter = getDailyCardioCount();

    // Check daily workout completion (15 total sets or 1 cardio)
    const isCardio = MUSCLE_GROUPS.cardio.exercises.some(e => e.id === exerciseId);
    if (isCardio && !cardioCelebrated && cardioBefore < 1 && cardioAfter >= 1) {
      cardioCelebrated = true;
      celebrateDaily();
    } else if (!isCardio && !exerciseCelebrated && dailyBefore < 15 && dailyAfter >= 15) {
      exerciseCelebrated = true;
      celebrateDaily();
    } else if (target > 0 && volBefore < target && volAfter >= target) {
      celebrate(MUSCLE_GROUPS[groupKey].label + ' Goal Reached!');
    }

    // Open push window
    if (pushWindow) clearTimeout(pushWindow.timer);
    pushWindow = { exerciseId, ts: entry.ts, timer: setTimeout(clearPushWindow, 3000) };

    lastAction = { exerciseId, entry };
    showUndo(exerciseId);
    renderAll();
  }

  function removeLastTodaySet(exerciseId) {
    const today = todayStr();
    const logs = data.logs[exerciseId] || [];
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].date === today) {
        logs.splice(i, 1);
        saveData();
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
    // Re-render to hide the push icon
    skipAnimation = true;
    renderExercises();
    skipAnimation = false;
  }

  function findExercise(exerciseId) {
    for (const group of Object.values(MUSCLE_GROUPS)) {
      const ex = group.exercises.find(e => e.id === exerciseId);
      if (ex) return ex;
    }
    return null;
  }

  function getGroupExercises(groupKey) {
    const builtIn = MUSCLE_GROUPS[groupKey].exercises;
    const custom = (data.customExercises[groupKey] || []);
    return builtIn.concat(custom);
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

  // ===== Swipe-to-delete =====
  const SWIPE_THRESHOLD = 70;

  function setupSwipe(card) {
    const inner = card.querySelector('.swipe-inner');
    let startX = 0, currentX = 0, swiping = false, opened = false;

    inner.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      currentX = 0;
      swiping = true;
      inner.style.transition = 'none';
    }, { passive: true });

    inner.addEventListener('touchmove', (e) => {
      if (!swiping) return;
      const dx = e.touches[0].clientX - startX;
      // Allow only leftward swipe (negative), or rightward to close
      if (opened) {
        currentX = Math.min(0, Math.max(-SWIPE_THRESHOLD, dx - SWIPE_THRESHOLD));
      } else {
        currentX = Math.min(0, dx);
      }
      inner.style.transform = `translateX(${currentX}px)`;
      // Prevent vertical scroll while swiping horizontally
      if (Math.abs(dx) > 10) e.preventDefault();
    }, { passive: false });

    inner.addEventListener('touchend', () => {
      swiping = false;
      inner.style.transition = 'transform 0.25s ease';
      if (currentX < -SWIPE_THRESHOLD / 2) {
        inner.style.transform = `translateX(-${SWIPE_THRESHOLD}px)`;
        opened = true;
        card.classList.add('swipe-open');
      } else {
        inner.style.transform = 'translateX(0)';
        opened = false;
        card.classList.remove('swipe-open');
      }
    }, { passive: true });

    card._closeSwipe = () => {
      inner.style.transition = 'transform 0.25s ease';
      inner.style.transform = 'translateX(0)';
      opened = false;
      card.classList.remove('swipe-open');
    };
  }

  function closeAllSwipes(exceptCard) {
    document.querySelectorAll('.exercise-card.swipe-open').forEach(c => {
      if (c !== exceptCard && c._closeSwipe) c._closeSwipe();
    });
  }

  function handleSwipeDelete(exerciseId, groupKey, isCustom, name) {
    if (isCustom) {
      removeCustomExercise(groupKey, exerciseId);
      showToast(`Deleted ${name}`);
    } else {
      delete data.logs[exerciseId];
      saveData();
      showToast(`Cleared ${name} history`);
    }
    renderAll();
  }

  // ===== Rendering =====
  let skipAnimation = false;

  function renderAll() {
    renderDate();
    renderSummary();
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

    for (const key of groupKeys) {
      // When a group is active, only render that group
      if (activeGroup && key !== activeGroup) continue;

      const group = MUSCLE_GROUPS[key];
      const target = getTarget(key);
      const { total: vol, pushed: pushVol, buckets } = getGroupStats14Days(key);
      const pushPct = target > 0 ? Math.min((pushVol / target) * 100, 100) : 0;

      // Build segmented bar fills ordered: recent, yesterday, today
      const segments = [
        { count: buckets.expiring, color: '#f87171' },
        { count: buckets.recent, color: '#fbbf24' },
        { count: buckets.yesterday, color: '#22c55e' },
        { count: buckets.today, color: '#4ade80' },
      ];
      let segmentsHtml = '';
      let leftPct = 0;
      for (const seg of segments) {
        if (seg.count <= 0 || target <= 0) continue;
        const w = Math.min(seg.count / target * 100, 100 - leftPct);
        if (w <= 0) continue;
        segmentsHtml += `<div class="summary-bar-fill" style="left:${leftPct}%;width:${w}%;background:${seg.color}"></div>`;
        leftPct += w;
      }

      const row = document.createElement('div');
      row.className = 'summary-row';
      row.dataset.group = key;
      if (key === activeGroup) row.classList.add('active');
      row.innerHTML = `
        <span class="summary-label">${group.label}</span>
        <div class="summary-bar-track">
          ${segmentsHtml}
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
      card.innerHTML = `
        <div class="swipe-inner">
          <div class="exercise-icon">${ex.icon}</div>
          <div class="exercise-info">
            <div class="exercise-name">${sanitize(ex.name)}</div>
            <div class="exercise-meta">${metaHtml}</div>
          </div>
          <button class="push-icon${hasPushWindow ? ' push-icon-active' : ''}" data-exercise="${ex.id}" aria-label="Mark as pushed">🔥</button>
          <div class="exercise-sets">${dotsHtml}</div>
        </div>
        <button class="swipe-delete-btn" data-exercise="${ex.id}" data-custom="${isCustom}">${isCustom ? 'Delete' : 'Clear'}</button>
      `;

      // Swipe-to-reveal-delete
      setupSwipe(card);

      // Tap on card body to log 1 set
      card.querySelector('.swipe-inner').addEventListener('click', (e) => {
        if (e.target.closest('.exercise-sets')) return;
        if (e.target.closest('.push-icon')) return;
        logExercise(ex.id);
        showToast(`+1 set ${sanitize(ex.name)}`);
      });

      // Tap delete button
      card.querySelector('.swipe-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        handleSwipeDelete(ex.id, activeGroup, isCustom, sanitize(ex.name));
      });

      // Tap push icon to mark as pushed
      card.querySelector('.push-icon').addEventListener('click', (e) => {
        e.stopPropagation();
        markLastSetAsPush(ex.id);
      });

      // Tap dots to remove last today's set
      card.querySelector('.exercise-sets').addEventListener('click', (e) => {
        e.stopPropagation();
        if (todaySets > 0) {
          removeLastTodaySet(ex.id);
        }
      });

      // Close any open swipe when tapping on another card
      card.querySelector('.swipe-inner').addEventListener('touchstart', () => {
        closeAllSwipes(card);
      }, { passive: true });

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

  // ===== Add Custom Exercise =====
  function promptAddExercise(groupKey) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    title.textContent = 'Add Exercise';
    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <input type="text" id="new-exercise-input" placeholder="Exercise name" maxlength="40"
          style="background:var(--bg);border:2px solid var(--surface2);border-radius:10px;padding:12px 14px;color:var(--text);font-size:1rem;outline:none;width:100%;box-sizing:border-box;"
        />
        <button class="btn btn-primary" id="add-exercise-confirm">Add</button>
      </div>
    `;

    modal.classList.remove('hidden');

    const input = document.getElementById('new-exercise-input');
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
  }

  // ===== Celebration =====
  function celebrate(message) {
    const overlay = document.createElement('div');
    overlay.className = 'celebrate-overlay';

    // Banner text
    const banner = document.createElement('div');
    banner.className = 'celebrate-banner';
    banner.textContent = message;
    overlay.appendChild(banner);

    // Confetti particles
    const colors = ['#4ade80', '#6c63ff', '#fbbf24', '#ff6b81', '#63b3ff', '#ce82ff', '#ff9f43', '#2ed573'];
    const shapes = ['●', '■', '▲', '★', '◆'];
    for (let i = 0; i < 60; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti';
      particle.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      particle.style.color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 0.5 + 's';
      particle.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
      particle.style.fontSize = (10 + Math.random() * 18) + 'px';
      overlay.appendChild(particle);
    }

    document.getElementById('app').appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add('celebrate-fade');
      setTimeout(() => overlay.remove(), 500);
    }, 2200);
  }

  function celebrateDaily() {
    const overlay = document.createElement('div');
    overlay.className = 'celebrate-overlay';

    // Banner
    const banner = document.createElement('div');
    banner.className = 'celebrate-banner';
    banner.textContent = 'Workout Complete! \ud83d\udcaa';
    overlay.appendChild(banner);

    // Starburst particles — explode outward from center
    const emojis = ['\u2b50', '\ud83d\udcaa', '\ud83d\udd25', '\u26a1', '\ud83c\udf1f', '\ud83c\udfc6', '\ud83d\ude80', '\ud83c\udf89'];
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = 'starburst';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const angle = (Math.PI * 2 * i) / 40 + (Math.random() - 0.5) * 0.3;
      const dist = 120 + Math.random() * 200;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      p.style.setProperty('--tx', tx + 'px');
      p.style.setProperty('--ty', ty + 'px');
      p.style.animationDelay = Math.random() * 0.3 + 's';
      p.style.animationDuration = (0.8 + Math.random() * 0.6) + 's';
      p.style.fontSize = (16 + Math.random() * 16) + 'px';
      overlay.appendChild(p);
    }

    document.getElementById('app').appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add('celebrate-fade');
      setTimeout(() => overlay.remove(), 500);
    }, 2500);
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

      // Push streak banner
      const ps = getPushStats(exercise.id);
      if (ps.streak > 1) {
        html += `<div class="push-streak-banner">🔥 Pushed ${ps.streak} sessions in a row</div>`;
      }

      for (const [date, entries] of Object.entries(byDate)) {
        const ago = daysAgo(date);
        const pushCount = entries.filter(e => e.push).length;
        const setsLabel = pushCount > 0
          ? `${entries.length} sets (${pushCount} 🔥)`
          : `${entries.length} sets`;
        html += `
          <div class="history-entry">
            <div>
              <div class="history-date">${formatDateNice(date)}</div>
              <div class="history-ago ${freshnessClass(ago)}">${daysAgoLabel(ago)}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:600">${setsLabel}</div>
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
      <span>Tap dots to undo</span>
    `;
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
    _sanitizeEl.textContent = str;
    return _sanitizeEl.innerHTML;
  }

  // ===== Tab Navigation =====
  function switchToGroup(groupKey) {
    const card = document.getElementById('summary');
    if (activeGroup === groupKey) {
      // Toggle off
      collapseExercises();
      activeGroup = null;
      card.classList.remove('card-compact');
      renderSummary();
      return;
    }
    activeGroup = groupKey;
    card.classList.add('card-compact');
    renderExercises();
    renderSummary();
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

  // ===== Modal Close =====
  function initModal() {
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  }

  // ===== Init =====
  function init() {
    initModal();
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
        data = { logs: {}, targets: {}, customExercises: {} };
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

    title.textContent = 'Edit History';

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
    for (const key of groupKeys) {
      const g = MUSCLE_GROUPS[key];
      tabsHtml += `<button class="history-tab${key === currentGroup ? ' active' : ''}" data-group="${key}">${g.label}</button>`;
    }
    tabsHtml += '</div>';

    // Day header cells (flat — direct children of the grid scroll container)
    let headerHtml = '<div class="history-grid-name history-grid-corner"></div>';
    for (const day of days) {
      headerHtml += `<div class="history-grid-day"><span>${day.label}</span><span>${day.num}</span></div>`;
    }

    // Exercise rows for current group (flat — no row wrappers)
    const exercises = MUSCLE_GROUPS[currentGroup].exercises;
    let rowsHtml = '';
    for (const ex of exercises) {
      rowsHtml += `<div class="history-grid-name">${sanitize(ex.name)}</div>`;
      for (const day of days) {
        const logs = (data.logs[ex.id] || []).filter(l => l.date === day.date);
        const count = logs.length;
        const maxDots = ex.dots;
        rowsHtml += `<div class="history-grid-cell" data-exercise="${ex.id}" data-date="${day.date}" data-count="${count}" data-max="${maxDots}">`;
        rowsHtml += `<span class="history-cell-num${count > 0 ? ' has-sets' : ''}">${count || ''}</span>`;
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

    // Cell tapping
    body.querySelectorAll('.history-grid-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const exId = cell.dataset.exercise;
        const date = cell.dataset.date;
        const max = parseInt(cell.dataset.max, 10);
        let current = parseInt(cell.dataset.count, 10);

        if (current >= max) {
          // Remove all logs for this exercise on this date
          if (data.logs[exId]) {
            data.logs[exId] = data.logs[exId].filter(l => l.date !== date);
          }
          current = 0;
        } else {
          // Add one log
          if (!data.logs[exId]) data.logs[exId] = [];
          data.logs[exId].push({ date, ts: parseDate(date).getTime() + data.logs[exId].filter(l => l.date === date).length });
          current++;
        }

        saveData();
        cell.dataset.count = current;
        const numEl = cell.querySelector('.history-cell-num');
        numEl.textContent = current || '';
        numEl.classList.toggle('has-sets', current > 0);
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
      text: 'Your sets per muscle group over 14 days.',
      position: 'below',
    },
    {
      target: '.summary-row',
      title: 'Bar Colors',
      text: 'Green = recent, yellow = older, red = expiring soon.',
      position: 'below',
    },
    {
      target: '.summary-row',
      title: 'Select a Group',
      text: 'Tap a muscle group to see its exercises.',
      position: 'below',
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
      target: '.exercise-sets',
      title: 'Remove a Set',
      text: 'Tap the dots to undo your last set today.',
      position: 'above',
      fallback: true,
    },
    {
      target: '.push-icon',
      title: 'Push Set 🔥',
      text: 'Tap the fire icon after logging to mark it as extra effort.',
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
    // Ensure a group is selected so exercise cards are visible for later steps
    if (!activeGroup) {
      switchToGroup('back');
    }
    tutorialStep = 0;
    showTutorialStep();
  }

  function showTutorialStep() {
    // Clean up previous overlay
    if (tutorialOverlay) tutorialOverlay.remove();
    if (tutorialStep >= TUTORIAL_STEPS.length) return;

    const step = TUTORIAL_STEPS[tutorialStep];
    let targetEl = document.querySelector(step.target);

    // If target doesn't exist (e.g. no exercises rendered), skip
    if (!targetEl && step.fallback) {
      tutorialStep++;
      showTutorialStep();
      return;
    }
    if (!targetEl) targetEl = document.getElementById('app');

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

    if (step.position === 'below') {
      tooltip.style.top = (rect.bottom + pad + 12) + 'px';
    } else {
      let above = rect.top - pad - 12 - tooltipRect.height;
      if (above < 16) above = rect.bottom + pad + 12;
      tooltip.style.top = above + 'px';
    }
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
  }
})();
