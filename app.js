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
        { id: 'back_misc', name: 'Misc', icon: '➕', dots: 4 },
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
        { id: 'shoulders_misc', name: 'Misc', icon: '➕', dots: 4 },
      ],
    },
    chest: {
      label: 'Chest',
      icon: '🫁',
      target: 15,
      exercises: [
        { id: 'chest_press', name: 'Press', icon: '🏋️', dots: 4 },
        { id: 'flys', name: 'Flys', icon: '🦅', dots: 4 },
        { id: 'chest_misc', name: 'Misc', icon: '➕', dots: 4 },
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
        { id: 'legs_misc', name: 'Misc', icon: '➕', dots: 4 },
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
        { id: 'arms_misc', name: 'Misc', icon: '➕', dots: 4 },
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
    return { logs: {}, targets: {} };
    // logs: { [exerciseId]: [ { date: "YYYY-MM-DD" }, ... ] }
    // targets: { [groupKey]: number }
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
    if (n === 0) return 'freshness-today';
    if (n === 1) return 'freshness-yesterday';
    if (n <= 12) return 'freshness-recent';
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
    const group = MUSCLE_GROUPS[groupKey];
    const today = todayStr();
    let total = 0;
    let pushed = 0;
    // Freshness buckets: today(0), yesterday(1), recent(2-12), stale(13+)
    const buckets = { today: 0, yesterday: 0, recent: 0, stale: 0 };
    for (const ex of group.exercises) {
      const logs = data.logs[ex.id] || [];
      for (const l of logs) {
        const ago = daysBetween(l.date, today);
        if (ago < VOLUME_WINDOW_DAYS) {
          total++;
          if (l.push) pushed++;
          if (ago === 0) buckets.today++;
          else if (ago === 1) buckets.yesterday++;
          else if (ago <= 12) buckets.recent++;
          else buckets.stale++;
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
      const group = MUSCLE_GROUPS[key];
      const target = getTarget(key);
      const { total: vol, pushed: pushVol, buckets } = getGroupStats14Days(key);
      const pushPct = target > 0 ? Math.min((pushVol / target) * 100, 100) : 0;

      // Build segmented bar fills ordered: today, yesterday, recent, stale
      const segments = [
        { count: buckets.stale, color: '#f87171' },
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
      if (activeGroup && key !== activeGroup) row.classList.add('faded');
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
        // Any tap on any row (active or faded) toggles back to full view
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

    // Clip and scroll to center active row
    if (activeGroup) {
      requestAnimationFrame(() => {
        const activeRow = container.querySelector('.summary-row.active');
        const stepper = container.querySelector('.target-stepper-row');
        if (activeRow) {
          const rowH = activeRow.offsetHeight;
          const stepperH = stepper ? stepper.offsetHeight : 0;
          const gap = 10; // matches #summary-bars gap
          // Visible window: half-row + gap + active row + gap + stepper + gap + half-row
          const visibleH = rowH * 0.5 + gap + rowH + gap + stepperH + gap + rowH * 0.5;
          container.style.maxHeight = visibleH + 'px';
          container.style.overflow = 'hidden';
          // Shift content so active row is centered in the window
          const rowTop = activeRow.offsetTop;
          const scrollTarget = Math.max(0, rowTop - (rowH * 0.5 + gap));
          for (const child of container.children) {
            child.style.transform = `translateY(-${scrollTarget}px)`;
          }
        }
      });
    } else {
      container.style.maxHeight = '';
      container.style.overflow = '';
    }
  }

  function renderExercises() {
    const container = document.getElementById('exercises');
    container.innerHTML = '';

    const group = MUSCLE_GROUPS[activeGroup];
    if (!group) return;

    let idx = 0;
    for (const ex of group.exercises) {
      const todayLogs = getTodayLogs(ex.id);
      const todaySets = todayLogs.length;
      const lastDate = getLastDate(ex.id);
      const ago = lastDate ? daysAgo(lastDate) : null;

      const card = document.createElement('div');
      card.className = `exercise-card group-${activeGroup}`;
      const fc = lastDate ? freshnessClass(ago) : 'freshness-stale';
      card.classList.add(fc);

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
      if (lastDate) {
        metaHtml = `<span class="${freshnessClass(ago)}">${daysAgoLabel(ago)}</span>`;
      } else {
        metaHtml = `<span class="freshness-stale">Never</span>`;
      }

      // Check if push window is active for this exercise
      const hasPushWindow = pushWindow && pushWindow.exerciseId === ex.id;

      card.innerHTML = `
        <div class="exercise-icon">${ex.icon}</div>
        <div class="exercise-info">
          <div class="exercise-name">${sanitize(ex.name)}</div>
          <div class="exercise-meta">${metaHtml}</div>
        </div>
        <button class="push-icon${hasPushWindow ? ' push-icon-active' : ''}" data-exercise="${ex.id}" aria-label="Mark as pushed">🔥</button>
        <div class="exercise-sets">${dotsHtml}</div>
        <button class="exercise-more" data-exercise="${ex.id}" aria-label="History">⋯</button>
      `;

      // Tap on card body to log 1 set
      card.addEventListener('click', (e) => {
        if (e.target.closest('.exercise-more')) return;
        if (e.target.closest('.exercise-sets')) return;
        if (e.target.closest('.push-icon')) return;
        logExercise(ex.id);
        showToast(`+1 set ${sanitize(ex.name)}`);
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

      // Tap ⋯ for history
      card.querySelector('.exercise-more').addEventListener('click', (e) => {
        e.stopPropagation();
        openHistory(ex);
      });

      container.appendChild(card);

      // Animate entrance based on group
      animateCardIn(card, activeGroup, idx);
      idx++;
    }
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
        <button class="btn btn-primary settings-action" id="export-btn">Export Data</button>
        <button class="btn btn-danger settings-action" id="clear-all-btn">Clear All Data</button>
      </div>
    `;

    document.getElementById('edit-history-btn').addEventListener('click', () => {
      openHistoryEditor();
    });
    document.getElementById('export-btn').addEventListener('click', exportData);
    document.getElementById('clear-all-btn').addEventListener('click', () => {
      if (confirm('Delete ALL workout data? This cannot be undone.')) {
        data = { logs: {}, targets: {} };
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
})();
