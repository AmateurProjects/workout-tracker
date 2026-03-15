// ===== Workout Tracker App =====
(function () {
  'use strict';

  // ===== Configuration =====
  const STORAGE_KEY = 'workout_tracker_data';
  const QUOTE_KEY = 'workout_tracker_last_quote_date';
  const QUOTE_SEEN_KEY = 'workout_tracker_seen_quotes';
  const VOLUME_WINDOW_DAYS = 14;

  // ===== Daily Inspiration =====
  const DAILY_QUOTES = [
    { text: 'The last three or four reps is what makes the muscle grow.', author: 'Arnold Schwarzenegger' },
    { text: 'I\'ve failed over and over and over again in my life. And that is why I succeed.', author: 'Michael Jordan' },
    { text: 'Strength does not come from the physical capacity. It comes from an indomitable will.', author: 'Mahatma Gandhi' },
    { text: 'The pain you feel today will be the strength you feel tomorrow.', author: 'Arnold Schwarzenegger' },
    { text: 'Take care of your body. It\'s the only place you have to live.', author: 'Jim Rohn' },
    { text: 'The clock is ticking. Are you becoming the person you want to be?', author: 'Greg Plitt' },
    { text: 'Success usually comes to those who are too busy to be looking for it.', author: 'Henry David Thoreau' },
    { text: 'All progress takes place outside the comfort zone.', author: 'Michael John Bobak' },
    { text: 'The body achieves what the mind believes.', author: 'Napoleon Hill' },
    { text: 'If something stands between you and your success, move it. Never be denied.', author: 'Dwayne Johnson' },
    { text: 'You don\'t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
    { text: 'The only place where success comes before work is in the dictionary.', author: 'Vidal Sassoon' },
    { text: 'Once you learn to quit, it becomes a habit.', author: 'Vince Lombardi' },
    { text: 'What hurts today makes you stronger tomorrow.', author: 'Jay Cutler' },
    { text: 'The resistance that you fight physically in the gym and the resistance that you fight in life can only build a strong character.', author: 'Arnold Schwarzenegger' },
    { text: 'Discipline is doing what you hate to do, but doing it like you love it.', author: 'Mike Tyson' },
    { text: 'Your body can stand almost anything. It\'s your mind that you have to convince.', author: 'Andrew Murphy' },
    { text: 'Don\'t count the days, make the days count.', author: 'Muhammad Ali' },
    { text: 'I hated every minute of training, but I said, don\'t quit. Suffer now and live the rest of your life as a champion.', author: 'Muhammad Ali' },
    { text: 'Hard work beats talent when talent doesn\'t work hard.', author: 'Tim Notke' },
    { text: 'No pain, no gain. Shut up and train.', author: 'Ronnie Coleman' },
    { text: 'You must expect great things of yourself before you can do them.', author: 'Michael Jordan' },
    { text: 'The successful warrior is the average man, with laser-like focus.', author: 'Bruce Lee' },
    { text: 'Be patient and tough; someday this pain will be useful to you.', author: 'Ovid' },
    { text: 'We are what we repeatedly do. Excellence then is not an act, but a habit.', author: 'Aristotle' },
    { text: 'Push harder than yesterday if you want a different tomorrow.', author: 'Vincent Williams Sr.' },
    { text: 'The iron never lies to you. Two hundred pounds is always two hundred pounds.', author: 'Henry Rollins' },
    { text: 'Motivation is what gets you started. Habit is what keeps you going.', author: 'Jim Ryun' },
    { text: 'You miss 100% of the shots you don\'t take.', author: 'Wayne Gretzky' },
    { text: 'Whether you think you can or you think you can\'t, you\'re right.', author: 'Henry Ford' },
    { text: 'Everybody wants to be a bodybuilder, but nobody wants to lift no heavy weights.', author: 'Ronnie Coleman' },
    { text: 'The difference between the impossible and the possible lies in a person\'s determination.', author: 'Tommy Lasorda' },
    { text: 'I do not think there is any other quality so essential to success of any kind as the quality of perseverance.', author: 'John D. Rockefeller' },
    { text: 'A champion is someone who gets up when they can\'t.', author: 'Jack Dempsey' },
    { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
    { text: 'If you want something you\'ve never had, you must be willing to do something you\'ve never done.', author: 'Thomas Jefferson' },
    { text: 'Courage is not having the strength to go on; it is going on when you don\'t have the strength.', author: 'Theodore Roosevelt' },
    { text: 'You shall gain, but you shall pay with sweat, blood, and vomit.', author: 'Pavel Tsatsouline' },
    { text: 'To keep the body in good health is a duty. Otherwise we shall not be able to keep our mind strong and clear.', author: 'Buddha' },
    { text: 'Training gives us an outlet for suppressed energies created by stress and thus tones the spirit just as exercise conditions the body.', author: 'Arnold Schwarzenegger' },
    { text: 'The fight is won or lost far away from witnesses — behind the lines, in the gym, and out there on the road.', author: 'Muhammad Ali' },
    { text: 'Run when you can, walk if you have to, crawl if you must; just never give up.', author: 'Dean Karnazes' },
    { text: 'The only person you are destined to become is the person you decide to be.', author: 'Ralph Waldo Emerson' },
    { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
    { text: 'Energy and persistence conquer all things.', author: 'Benjamin Franklin' },
    { text: 'Our greatest glory is not in never falling, but in rising every time we fall.', author: 'Confucius' },
    { text: 'Champions aren\'t made in gyms. Champions are made from something they have deep inside them — a desire, a dream, a vision.', author: 'Muhammad Ali' },
    { text: 'The only way to prove that you\'re a good sport is to lose.', author: 'Ernie Banks' },
    { text: 'When you hit failure, your workout has just begun.', author: 'Ronnie Coleman' },
    { text: 'The purpose of training is to tighten up the slack, toughen the body, and polish the spirit.', author: 'Morihei Ueshiba' },
    { text: 'Most people fail, not because of lack of desire, but because of lack of commitment.', author: 'Vince Lombardi' },
    { text: 'Some people want it to happen, some wish it would happen, others make it happen.', author: 'Michael Jordan' },
    { text: 'Today I will do what others won\'t, so tomorrow I can accomplish what others can\'t.', author: 'Jerry Rice' },
    { text: 'The mind is the most important part of achieving any fitness goal.', author: 'Phil Heath' },
    { text: 'You dream. You plan. You reach. There will be obstacles. There will be doubters. There will be mistakes. But with hard work, with belief, there are no limits.', author: 'Michael Phelps' },
    { text: 'Blood, sweat, and respect. The first two you give, the last one you earn.', author: 'Dwayne Johnson' },
    { text: 'I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.', author: 'Bruce Lee' },
    { text: 'Fitness is not about being better than someone else. It\'s about being better than you used to be.', author: 'Khloe Kardashian' },
    { text: 'Just believe in yourself. Even if you don\'t, pretend that you do and at some point, you will.', author: 'Venus Williams' },
    { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
    { text: 'Physical fitness is the first requisite of happiness.', author: 'Joseph Pilates' },
    { text: 'A year from now you may wish you had started today.', author: 'Karen Lamb' },
    { text: 'When I feel tired, I just think about how great I will feel once I finally reach my goal.', author: 'Michael Phelps' },
    { text: 'To give anything less than your best is to sacrifice the gift.', author: 'Steve Prefontaine' },
    { text: 'Go the extra mile. It\'s never crowded.', author: 'Wayne Dyer' },
    { text: 'What we achieve inwardly will change outer reality.', author: 'Plutarch' },
    { text: 'The only way to define your limits is by going beyond them.', author: 'Arthur C. Clarke' },
    { text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins' },
    { text: 'Exercise is king. Nutrition is queen. Put them together and you\'ve got a kingdom.', author: 'Jack LaLanne' },
    { text: 'Don\'t limit your challenges. Challenge your limits.', author: 'Jerry Dunn' },
    { text: 'The real workout starts when you want to stop.', author: 'Ronnie Coleman' },
    { text: 'The groundwork for all happiness is good health.', author: 'Leigh Hunt' },
    { text: 'Never give up on a dream just because of the time it will take to accomplish it. The time will pass anyway.', author: 'Earl Nightingale' },
    { text: 'It\'s supposed to be hard. If it were easy, everybody would do it.', author: 'Tom Hanks' },
    { text: 'Perfection is not attainable, but if we chase perfection we can catch excellence.', author: 'Vince Lombardi' },
    { text: 'The more you sweat in training, the less you bleed in combat.', author: 'Richard Marcinko' },
    { text: 'The harder the battle, the sweeter the victory.', author: 'Les Brown' },
    { text: 'Success is walking from failure to failure with no loss of enthusiasm.', author: 'Winston Churchill' },
    { text: 'Great works are performed not by strength but by perseverance.', author: 'Samuel Johnson' },
    { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
    { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
    { text: 'You have to think it before you can do it. The mind is what makes it all possible.', author: 'Kai Greene' },
    { text: 'Tough times don\'t last. Tough people do.', author: 'Robert Schuller' },
    { text: 'Fall seven times, stand up eight.', author: 'Japanese Proverb' },
    { text: 'No one ever drowned in sweat.', author: 'Lou Holtz' },
    { text: 'You are never really playing an opponent. You are playing yourself.', author: 'Arthur Ashe' },
    { text: 'In training, you listen to your body. In competition, you tell your body to shut up.', author: 'Rich Froning Jr.' },
    { text: 'Suffer the pain of discipline or suffer the pain of regret.', author: 'Jim Rohn' },
    { text: 'Your body is not a temple — it\'s an amusement park. Enjoy the ride.', author: 'Anthony Bourdain' },
    { text: 'I don\'t stop when I\'m tired. I stop when I\'m done.', author: 'David Goggins' },
    { text: 'You can have results or excuses, but not both.', author: 'Arnold Schwarzenegger' },
    { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
    { text: 'The will to win means nothing without the will to prepare.', author: 'Juma Ikangaa' },
    { text: 'Nothing will work unless you do.', author: 'Maya Angelou' },
    { text: 'Strength doesn\'t come from what you can do. It comes from overcoming the things you once thought you couldn\'t.', author: 'Rikki Rogers' },
    { text: 'It is a shame for a man to grow old without seeing the beauty and strength of which his body is capable.', author: 'Socrates' },
    { text: 'The body is the servant of the mind.', author: 'James Allen' },
    { text: 'The pain of discipline weighs ounces. The pain of regret weighs tons.', author: 'Jim Rohn' },
    { text: 'Discipline equals freedom.', author: 'Jocko Willink' },
    { text: 'Work hard in silence, let your success be your noise.', author: 'Frank Ocean' },
  ];

  // ===== Exercise Definitions =====
  const MUSCLE_GROUPS = {
    back: {
      label: 'Back',
      icon: '🔙',
      target: 15,
      exercises: [
        { id: 'pullup', name: 'Pull Up / Pull Down', icon: '💪', dots: 4 },
        { id: 'row', name: 'Row', icon: '🚣', dots: 4 },
        { id: 'upperback', name: 'Upper Back', icon: '🦅', dots: 4 },
      ],
    },
    shoulders: {
      label: 'Shoulders',
      icon: '🏋️',
      target: 15,
      exercises: [
        { id: 'lateral_raise', name: 'Lateral Raise', icon: '🙆', dots: 4 },
        { id: 'overhead_press', name: 'Overhead Press', icon: '🏋️', dots: 4 },
        { id: 'rear_delt', name: 'Rear Delt', icon: '🦋', dots: 4 },
      ],
    },
    chest: {
      label: 'Chest',
      icon: '🫁',
      target: 15,
      exercises: [
        { id: 'chest_press', name: 'Chest Press', icon: '🎽', dots: 4 },
        { id: 'flys', name: 'Flys', icon: '�', dots: 4 },
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
        { id: 'rdl', name: 'RDL', icon: '🪢', dots: 4 },
        { id: 'squats', name: 'Squats', icon: '🏋️', dots: 4 },
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

  let expandedGroups = new Set(); // track which muscle groups are expanded
  let animatingGroups = new Set(); // guard against rapid taps during animation
  let expandedExercise = null; // track which exercise card is expanded
  let skipActionAnim = false; // suppress action button animation on re-render
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
  }

  function clearPushWindow() {
    if (!pushWindow) return;
    clearTimeout(pushWindow.timer);
    pushWindow = null;
    skipActionAnim = true;
    renderSummary();
    skipActionAnim = false;
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
    renderAll();
  }

  // ===== Rendering =====

  function renderAll() {
    renderDate();
    renderSummary();
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

    const ranked = groupKeys
      .map(k => ({ key: k, ...priorities[k] }))
      .sort((a, b) => b.score - a.score);
    const topKey = ranked[0] ? ranked[0].key : null;

    for (const key of groupKeys) {
      const group = MUSCLE_GROUPS[key];
      const target = getTarget(key);
      const { total: vol, pushed: pushVol } = getGroupStats14Days(key);
      const color = GROUP_COLORS[key] || '#6c63ff';
      const fillPct = target > 0 ? Math.min((vol / target) * 100, 100) : 0;
      const pushPct = target > 0 ? Math.min((pushVol / target) * 100, 100) : 0;

      const pri = priorities[key];
      const isTop = key === topKey && pri.score > 0;
      const isResting = pri.trainedToday && pri.deficit <= 0;
      const isExpanded = expandedGroups.has(key);

      const labelText = (isTop ? '🎯 ' : '') + group.label;

      const row = document.createElement('div');
      row.className = 'summary-row';
      row.dataset.group = key;
      if (isExpanded) row.classList.add('active');
      if (isTop) row.classList.add('focus-glow');
      if (isResting) row.classList.add('needs-rest');

      row.style.setProperty('--group-color', color);

      row.innerHTML = `
        <span class="summary-chevron${isExpanded ? ' open' : ''}">›</span>
        <span class="summary-label">${labelText}</span>
        <div class="summary-bar-track">
          <div class="summary-bar-fill" style="width:${fillPct}%;background:${color}"></div>
          ${pushVol > 0 ? `<div class="summary-bar-push" style="width:${pushPct}%"></div>` : ''}
          <span class="summary-bar-value">${vol} / ${target}</span>
        </div>
      `;
      row.addEventListener('click', (e) => {
        if (e.target.closest('.target-btn')) return;
        switchToGroup(key);
      });

      container.appendChild(row);

      // If expanded, add stepper + exercises inline
      if (isExpanded) {
        const stepperRow = buildStepperRow(key, target);
        container.appendChild(stepperRow);

        const exContainer = buildExerciseContainer(key);
        container.appendChild(exContainer);
      }
    }
  }

  function buildStepperRow(groupKey, target) {
    const stepperRow = document.createElement('div');
    stepperRow.className = 'target-stepper-row';
    stepperRow.dataset.group = groupKey;
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
        const newTarget = Math.max(1, getTarget(groupKey) + dir);
        setTarget(groupKey, newTarget);
        renderSummary();
      });
    });
    return stepperRow;
  }

  function buildExerciseContainer(groupKey) {
    const exContainer = document.createElement('div');
    exContainer.className = 'group-exercises';
    exContainer.dataset.group = groupKey;

    const exercises = getGroupExercises(groupKey);
    for (const ex of exercises) {
      const todayLogs = getTodayLogs(ex.id);
      const todaySets = todayLogs.length;
      const lastDate = getLastDate(ex.id);
      const ago = lastDate ? daysAgo(lastDate) : null;

      const card = document.createElement('div');
      card.className = `exercise-card group-${groupKey}`;
      const withinWindow = lastDate && ago < VOLUME_WINDOW_DAYS;
      if (withinWindow) card.classList.add(freshnessClass(ago));

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

      let metaHtml = '';
      if (withinWindow) {
        metaHtml = `<span class="${freshnessClass(ago)}">${daysAgoLabel(ago)}</span>`;
      }

      const pr = data.personalRecords && data.personalRecords[ex.id];
      const prBadgeHtml = pr ? `<span class="pr-badge">PR: ${sanitize(pr.value)}${pr.unit ? ' ' + sanitize(pr.unit) : ''}</span>` : '';

      const isExerciseExpanded = expandedExercise === ex.id;

      card.innerHTML = `
        <div class="card-inner">
          <span class="card-chevron${isExerciseExpanded ? ' open' : ''}">›</span>
          <div class="exercise-icon">${ex.icon}</div>
          <div class="exercise-info">
            <div class="exercise-name">${sanitize(ex.name)}</div>
            ${prBadgeHtml ? `<div class="exercise-pr">${prBadgeHtml}</div>` : ''}
            <div class="exercise-meta">${metaHtml}</div>
          </div>
          <div class="exercise-sets">${dotsHtml}</div>
        </div>
        ${isExerciseExpanded ? `<div class="card-actions${skipActionAnim ? ' no-animate' : ''}">
          <button class="card-action-item card-action-add" data-exercise="${ex.id}">＋ Set</button>
          <button class="card-action-item card-action-heavy" data-exercise="${ex.id}">🔥 Heavy</button>
          <button class="card-action-item card-action-remove" data-exercise="${ex.id}">− Undo</button>
          <button class="card-action-item card-action-options" data-exercise="${ex.id}">✏️ More</button>
        </div>` : ''}
      `;

      // Tap on card header to toggle expand/collapse
      card.querySelector('.card-inner').addEventListener('click', () => {
        if (expandedExercise === ex.id) {
          const actions = card.querySelector('.card-actions');
          if (actions) {
            const btns = Array.from(actions.querySelectorAll('.card-action-item'));
            btns.reverse().forEach((btn, i) => {
              btn.style.transition = 'none';
              btn.style.opacity = '1';
              btn.style.transform = 'scale(1)';
              btn.style.animation = 'none';
              setTimeout(() => {
                btn.style.transition = 'opacity 0.15s ease, transform 0.18s ease';
                btn.style.opacity = '0';
                btn.style.transform = 'translateY(-8px) scale(0.85)';
              }, i * 45);
            });
            const foldDelay = btns.length * 45 + 160;
            setTimeout(() => {
              actions.style.maxHeight = actions.scrollHeight + 'px';
              actions.offsetHeight;
              actions.classList.add('collapsing');
              actions.style.maxHeight = '0';
              actions.style.padding = '0 18px';
              actions.style.opacity = '0';
            }, foldDelay);
            setTimeout(() => {
              expandedExercise = null;
              renderSummary();
            }, foldDelay + 200);
            return;
          }
          expandedExercise = null;
        } else {
          expandedExercise = ex.id;
        }
        renderSummary();
      });

      // Action button handlers
      if (isExerciseExpanded) {
        card.querySelector('.card-action-add').addEventListener('click', (e) => {
          e.stopPropagation();
          popBtn(e.currentTarget);
          if (!data.logs[ex.id]) data.logs[ex.id] = [];
          const entry = { date: todayStr(), ts: Date.now() };
          data.logs[ex.id].push(entry);
          saveData();
          if (pushWindow) clearTimeout(pushWindow.timer);
          pushWindow = { exerciseId: ex.id, ts: entry.ts, timer: setTimeout(clearPushWindow, 3000) };
          flashDots(card, ex.id);
          setTimeout(() => {
            skipActionAnim = true;
            renderAll();
            skipActionAnim = false;
          }, 180);
        });
        card.querySelector('.card-action-heavy').addEventListener('click', (e) => {
          e.stopPropagation();
          popBtn(e.currentTarget);
          if (!data.logs[ex.id]) data.logs[ex.id] = [];
          const entry = { date: todayStr(), ts: Date.now(), push: true };
          data.logs[ex.id].push(entry);
          saveData();
          if (pushWindow) { clearTimeout(pushWindow.timer); pushWindow = null; }
          flashDots(card, ex.id);
          setTimeout(() => {
            skipActionAnim = true;
            renderAll();
            skipActionAnim = false;
          }, 180);
        });
        card.querySelector('.card-action-remove').addEventListener('click', (e) => {
          e.stopPropagation();
          popBtn(e.currentTarget);
          const today = todayStr();
          const logs = data.logs[ex.id] || [];
          for (let ri = logs.length - 1; ri >= 0; ri--) {
            if (logs[ri].date === today) { logs.splice(ri, 1); saveData(); break; }
          }
          flashDots(card, ex.id);
          setTimeout(() => {
            skipActionAnim = true;
            renderAll();
            skipActionAnim = false;
          }, 180);
        });
        card.querySelector('.card-action-options').addEventListener('click', (e) => {
          e.stopPropagation();
          popBtn(e.currentTarget);
          setTimeout(() => {
            showExerciseOptions(ex.id, groupKey);
          }, 180);
        });
      }

      exContainer.appendChild(card);
    }

    // "Add Exercise" card
    const addCard = document.createElement('div');
    addCard.className = `exercise-card exercise-card-add group-${groupKey}`;
    addCard.innerHTML = `
      <div class="exercise-icon">➕</div>
      <div class="exercise-info">
        <div class="exercise-name" style="color:var(--text-dim)">Add Exercise</div>
      </div>
    `;
    addCard.addEventListener('click', () => {
      promptAddExercise(groupKey);
    });
    exContainer.appendChild(addCard);

    return exContainer;
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
          <input type="text" id="edit-exercise-name" value="${sanitize(ex.name)}" maxlength="24" placeholder="Exercise name"
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
        <input type="text" id="new-exercise-input" placeholder="Exercise name" maxlength="24"
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

  function popBtn(btn) {
    btn.classList.add('anim-done');
    btn.classList.remove('btn-pop');
    void btn.offsetWidth;
    btn.classList.add('btn-pop');
  }

  function flashDots(card, exerciseId) {
    const dotsEl = card.querySelector('.exercise-sets');
    if (!dotsEl) return;
    const ex = findExercise(exerciseId);
    if (!ex) return;
    const todayLogs = getTodayLogs(exerciseId);
    const todaySets = todayLogs.length;
    const dotCount = ex.dots;
    let html = '';
    for (let i = 0; i < dotCount; i++) {
      if (i < todaySets) {
        const isPushed = todayLogs[i] && todayLogs[i].push;
        html += `<span class="set-dot filled${isPushed ? ' pushed' : ''}"></span>`;
      } else {
        html += '<span class="set-dot"></span>';
      }
    }
    dotsEl.innerHTML = html;
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
    if (animatingGroups.has(groupKey)) return;
    if (expandedGroups.has(groupKey)) {
      collapseGroup(groupKey);
    } else {
      expandGroup(groupKey);
    }
  }

  function expandGroup(groupKey) {
    expandedGroups.add(groupKey);
    expandedExercise = null;
    animatingGroups.add(groupKey);

    const container = document.getElementById('summary-bars');
    const row = container.querySelector(`.summary-row[data-group="${groupKey}"]`);
    if (!row) { animatingGroups.delete(groupKey); return; }

    // Update row styling immediately
    row.classList.add('active');
    const chevron = row.querySelector('.summary-chevron');
    if (chevron) chevron.classList.add('open');

    // Build stepper
    const target = getTarget(groupKey);
    const stepperRow = buildStepperRow(groupKey, target);

    // Build exercise container
    const exContainer = buildExerciseContainer(groupKey);

    // Find insertion point — after the row
    row.insertAdjacentElement('afterend', stepperRow);
    stepperRow.insertAdjacentElement('afterend', exContainer);

    // Animate stepper in
    stepperRow.style.opacity = '0';
    stepperRow.style.overflow = 'hidden';
    stepperRow.style.height = 'auto';
    const stepperNatHeight = stepperRow.offsetHeight;
    stepperRow.style.height = '0';
    void stepperRow.offsetHeight;
    stepperRow.style.transition = 'height 0.25s ease-out, opacity 0.2s ease';
    stepperRow.style.height = stepperNatHeight + 'px';
    stepperRow.style.opacity = '1';
    setTimeout(() => {
      stepperRow.style.height = '';
      stepperRow.style.overflow = '';
      stepperRow.style.transition = '';
    }, 300);

    // Animate exercise cards — staggered top to bottom
    const cards = Array.from(exContainer.querySelectorAll('.exercise-card'));
    cards.forEach(card => { card.style.display = 'none'; });

    cards.forEach((card, i) => {
      setTimeout(() => {
        card.style.display = '';
        card.style.minHeight = '0';
        card.style.opacity = '0';
        const naturalHeight = card.offsetHeight;
        card.style.overflow = 'hidden';
        card.style.height = '0';
        void card.offsetHeight;
        card.style.transition = 'height 0.3s ease-out, opacity 0.25s ease';
        card.style.height = naturalHeight + 'px';
        card.style.opacity = '1';
      }, i * 60 + 80);

      setTimeout(() => {
        card.style.height = '';
        card.style.overflow = '';
        card.style.transition = '';
        card.style.minHeight = '';
      }, i * 60 + 80 + 350);
    });

    const totalTime = cards.length * 60 + 80 + 350;
    setTimeout(() => {
      animatingGroups.delete(groupKey);
    }, totalTime);
  }

  function collapseGroup(groupKey) {
    expandedGroups.delete(groupKey);
    expandedExercise = null;
    animatingGroups.add(groupKey);

    const container = document.getElementById('summary-bars');
    const row = container.querySelector(`.summary-row[data-group="${groupKey}"]`);
    const exContainer = container.querySelector(`.group-exercises[data-group="${groupKey}"]`);
    const stepperRow = container.querySelector(`.target-stepper-row[data-group="${groupKey}"]`);

    // Update row styling
    if (row) {
      row.classList.remove('active');
      const chevron = row.querySelector('.summary-chevron');
      if (chevron) chevron.classList.remove('open');
    }

    if (!exContainer) {
      if (stepperRow) stepperRow.remove();
      animatingGroups.delete(groupKey);
      return;
    }

    // Animate cards out — bottom to top
    const cards = Array.from(exContainer.querySelectorAll('.exercise-card'));
    const last = cards.length - 1;

    cards.forEach(card => {
      card.style.height = card.offsetHeight + 'px';
      card.style.overflow = 'hidden';
      card.style.minHeight = '0';
    });

    cards.forEach((card, i) => {
      const delay = (last - i) * 60;
      setTimeout(() => {
        card.style.transition = 'height 0.28s ease-in, opacity 0.2s ease';
        card.style.height = '0';
        card.style.opacity = '0';
      }, delay);
      setTimeout(() => {
        card.style.display = 'none';
      }, delay + 280);
    });

    const totalTime = last * 60 + 300;

    // Collapse stepper near the end
    if (stepperRow) {
      setTimeout(() => {
        stepperRow.style.overflow = 'hidden';
        stepperRow.style.transition = 'height 0.25s ease-in, opacity 0.2s ease';
        stepperRow.style.height = '0';
        stepperRow.style.opacity = '0';
      }, Math.max(0, totalTime - 150));
    }

    setTimeout(() => {
      if (exContainer.parentElement) exContainer.remove();
      if (stepperRow && stepperRow.parentElement) stepperRow.remove();
      animatingGroups.delete(groupKey);
    }, totalTime + 200);
  }

  // ===== Init =====
  function showDailyQuote() {
    const today = todayStr();
    if (localStorage.getItem(QUOTE_KEY) === today) return;
    localStorage.setItem(QUOTE_KEY, today);

    // Track seen quotes so none repeat until all 100 have been shown
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem(QUOTE_SEEN_KEY)) || []; } catch (e) { seen = []; }
    if (!Array.isArray(seen) || seen.length >= DAILY_QUOTES.length) seen = [];

    // Pick a random unseen quote
    const available = DAILY_QUOTES.map((_, i) => i).filter(i => !seen.includes(i));
    const pick = available[Math.floor(Math.random() * available.length)];
    seen.push(pick);
    localStorage.setItem(QUOTE_SEEN_KEY, JSON.stringify(seen));

    const quote = DAILY_QUOTES[pick];
    const overlay = document.createElement('div');
    overlay.className = 'quote-overlay';
    overlay.innerHTML = `
      <div class="quote-card">
        <div class="quote-text">\u201c${quote.text}\u201d</div>
        <div class="quote-author">\u2014 ${quote.author}</div>
      </div>
    `;
    overlay.addEventListener('click', () => {
      overlay.classList.add('quote-fade');
      setTimeout(() => overlay.remove(), 400);
    });
    document.getElementById('app').appendChild(overlay);
  }

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

    // Tap empty areas of summary card — no-op in accordion layout
    document.getElementById('summary').addEventListener('click', (e) => {
      if (e.target.closest('.summary-row') || e.target.closest('.target-stepper-row') ||
          e.target.closest('.exercise-card') || e.target.closest('.group-exercises')) return;
    });

    // Settings gear
    document.getElementById('settings-btn').addEventListener('click', openSettings);

    // Help button
    document.getElementById('help-btn').addEventListener('click', startTutorial);

    // Show daily inspirational quote (once per day)
    showDailyQuote();
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
        expandedGroups.clear();
        expandedExercise = null;
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
      text: 'Each bar tracks your sets over the last 14 days for each muscle group.',
      position: 'below',
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
    // Start from overview — collapse any expanded groups
    if (expandedGroups.size > 0) {
      expandedGroups.clear();
      expandedExercise = null;
      renderSummary();
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
    if (step.action === 'openGroup' && !expandedGroups.has('back')) {
      expandedGroups.add('back');
      renderSummary();
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
    // Return to initial state — collapse all groups
    if (expandedGroups.size > 0) {
      expandedGroups.clear();
      expandedExercise = null;
      renderSummary();
    }
  }
})();
