// ============================================================
//  app.js — UniSchedule Application Logic
// ============================================================

(function () {
  'use strict';

  // ── Constants ───────────────────────────────────────────
  const DAY_NAMES  = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  const DAY_SHORT  = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
  const DAY_KEYS   = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const MONTH_NAMES = [
    'Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
    'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'
  ];

  // Week‑day indices that have schedule (Mon=1 … Fri=5)
  const WEEKDAYS = [1, 2, 3, 4, 5];

  // ── State ───────────────────────────────────────────────
  let selectedGroup  = localStorage.getItem('uniScheduleGroup') || null;
  let selectedDayIdx = null;          // 0‑6 (JS getDay())
  let viewingDate    = new Date();    // the Monday of the week being viewed

  // ── DOM references (populated in init) ──────────────────
  let $onboarding, $app, $header, $dayTabs, $scheduleContainer;
  let $weekType, $weekNumber, $weekBadge;
  let $groupChipLabel, $modalOverlay, $modal;
  let $settingsBtn, $groupChip;

  // ── Helpers ─────────────────────────────────────────────

  /** Compute week info from a given date. */
  function getWeekInfo(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const start = new Date(SEMESTER_START);
    start.setHours(0, 0, 0, 0);

    const diffMs   = d.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(diffDays / 7);      // 0‑based
    const weekNumber = weekIndex + 1;
    const isOdd    = weekNumber % 2 !== 0;            // week 1 = odd (impară)

    return { weekNumber, isOdd };
  }

  /** Get Monday of the week that contains `date`. */
  function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  }

  /** Add days to a date (returns new Date). */
  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  /** Get the date string for a given day tab (dayIdx 1‑5). */
  function getDateForDay(mondayDate, dayIdx) {
    // dayIdx: 1=Mon, 2=Tue, … 5=Fri
    return addDays(mondayDate, dayIdx - 1);
  }

  /** Format time string "08:00" → parse hours & minutes for comparison. */
  function parseTime(str) {
    // Handles "08:00 – 10:00" → returns [8, 0] for start
    const match = str.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return { h: parseInt(match[1], 10), m: parseInt(match[2], 10) };
  }

  function parseEndTime(str) {
    const parts = str.split('–').map(s => s.trim());
    if (parts.length < 2) return null;
    const match = parts[1].match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return { h: parseInt(match[1], 10), m: parseInt(match[2], 10) };
  }

  /** Check if a class is currently in progress. */
  function isCurrentClass(timeStr) {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only compare if viewing today
    const viewDay = getDateForDay(viewingDate, selectedDayIdx);
    viewDay.setHours(0, 0, 0, 0);
    if (today.getTime() !== viewDay.getTime()) return false;

    const start = parseTime(timeStr);
    const end   = parseEndTime(timeStr);
    if (!start || !end) return false;

    const nowMinutes   = now.getHours() * 60 + now.getMinutes();
    const startMinutes = start.h * 60 + start.m;
    const endMinutes   = end.h * 60 + end.m;

    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }

  /** Get the greeting based on time of day. */
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 6)  return 'Noapte bună ✨';
    if (h < 12) return 'Bună dimineața ☀️';
    if (h < 18) return 'Bună ziua 👋';
    return 'Bună seara 🌙';
  }

  // ── Rendering ───────────────────────────────────────────

  function renderDayTabs() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    $dayTabs.innerHTML = '';

    WEEKDAYS.forEach(dayIdx => {
      const date = getDateForDay(viewingDate, dayIdx);
      date.setHours(0, 0, 0, 0);

      const btn = document.createElement('button');
      btn.className = 'day-tab';
      btn.dataset.day = dayIdx;

      if (dayIdx === selectedDayIdx) btn.classList.add('active');
      if (date.getTime() === today.getTime()) btn.classList.add('today');

      btn.innerHTML = `
        <span class="day-name">${DAY_SHORT[dayIdx]}</span>
        <span class="day-date">${date.getDate()}</span>
      `;

      btn.addEventListener('click', () => {
        selectedDayIdx = dayIdx;
        renderDayTabs();
        renderSchedule();
      });

      $dayTabs.appendChild(btn);
    });
  }

  function renderWeekBanner() {
    const info = getWeekInfo(getDateForDay(viewingDate, selectedDayIdx));
    $weekType.textContent   = info.isOdd ? 'Săptămâna Impară' : 'Săptămâna Pară';
    $weekNumber.textContent = `Săptămâna ${info.weekNumber} din semestru`;

    $weekBadge.textContent = info.isOdd ? 'Impară' : 'Pară';
    $weekBadge.className   = 'week-badge ' + (info.isOdd ? 'odd' : 'even');
  }

  function renderSchedule() {
    renderWeekBanner();

    const dayKey = DAY_KEYS[selectedDayIdx];
    const dayData = scheduleData[dayKey] || [];
    const weekInfo = getWeekInfo(getDateForDay(viewingDate, selectedDayIdx));

    // Filter by group & week
    const filtered = dayData.filter(item => {
      const groupMatch = item.group === 'all' || item.group === selectedGroup;
      const weekMatch  = item.week === 'all'
        || (item.week === 'odd'  && weekInfo.isOdd)
        || (item.week === 'even' && !weekInfo.isOdd);
      return groupMatch && weekMatch;
    });

    $scheduleContainer.innerHTML = '';

    if (filtered.length === 0) {
      $scheduleContainer.innerHTML = `
        <div class="empty-state">
          <div class="emoji">🎉</div>
          <h3>Zi liberă!</h3>
          <p>Nu ai ore programate în această zi. Bucură‑te de timpul liber!</p>
        </div>
      `;
      return;
    }

    // Re-trigger animation
    $scheduleContainer.classList.remove('fade-enter');
    void $scheduleContainer.offsetWidth;
    $scheduleContainer.classList.add('fade-enter');

    filtered.forEach(item => {
      const card = document.createElement('div');
      const typeClass = 'type-' + item.type;
      const currentClass = isCurrentClass(item.time) ? ' is-current' : '';
      card.className = `schedule-card ${typeClass}${currentClass}`;

      const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);

      card.innerHTML = `
        <div class="card-header">
          <div class="card-time">
            <span class="icon">🕐</span>
            ${item.time}
          </div>
          <span class="card-type-badge ${item.type}">${typeLabel}</span>
        </div>
        <div class="card-subject">${item.subject}</div>
        <div class="card-details">
          <span class="card-detail">
            <span class="icon">📍</span>
            ${item.room}
          </span>
          <span class="card-detail">
            <span class="icon">👤</span>
            ${item.professor}
          </span>
        </div>
      `;

      $scheduleContainer.appendChild(card);
    });
  }

  function renderHeader() {
    document.getElementById('header-greeting').textContent = getGreeting();
    $groupChipLabel.textContent = `Grupa ${selectedGroup}`;
  }

  // ── Modal (Settings) ───────────────────────────────────

  function openModal() {
    $modalOverlay.classList.add('visible');
    // Set active button
    document.querySelectorAll('.modal-group-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.group === selectedGroup);
    });
  }

  function closeModal() {
    $modalOverlay.classList.remove('visible');
  }

  function handleModalGroupChange(newGroup) {
    selectedGroup = newGroup;
    localStorage.setItem('uniScheduleGroup', selectedGroup);
    document.querySelectorAll('.modal-group-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.group === selectedGroup);
    });
    renderHeader();
    renderSchedule();
  }

  // ── Onboarding ─────────────────────────────────────────

  function selectGroup(group) {
    selectedGroup = group;
    localStorage.setItem('uniScheduleGroup', group);

    // Hide onboarding, show app
    $onboarding.classList.add('hidden');
    setTimeout(() => {
      $onboarding.style.display = 'none';
      $app.classList.remove('hidden');
      initApp();
    }, 500);
  }

  // ── Swipe Gesture ──────────────────────────────────────
  let touchStartX = 0;
  let touchEndX   = 0;

  function handleSwipe() {
    const diff = touchStartX - touchEndX;
    const threshold = 60;

    if (Math.abs(diff) < threshold) return;

    const currentIdx = WEEKDAYS.indexOf(selectedDayIdx);

    if (diff > 0) {
      // Swipe left → next day
      if (currentIdx < WEEKDAYS.length - 1) {
        selectedDayIdx = WEEKDAYS[currentIdx + 1];
      } else {
        // Go to next week Monday
        viewingDate = addDays(viewingDate, 7);
        selectedDayIdx = WEEKDAYS[0];
      }
    } else {
      // Swipe right → prev day
      if (currentIdx > 0) {
        selectedDayIdx = WEEKDAYS[currentIdx - 1];
      } else {
        // Go to prev week Friday
        viewingDate = addDays(viewingDate, -7);
        selectedDayIdx = WEEKDAYS[WEEKDAYS.length - 1];
      }
    }

    renderDayTabs();
    renderSchedule();
  }

  // ── Init ────────────────────────────────────────────────

  function initApp() {
    // Default to today if weekday, else Monday
    const today = new Date();
    const todayDay = today.getDay();
    viewingDate = getMondayOfWeek(today);

    if (todayDay >= 1 && todayDay <= 5) {
      selectedDayIdx = todayDay;
    } else {
      // Weekend → show next Monday
      if (todayDay === 0) {
        viewingDate = addDays(today, 1);
        viewingDate = getMondayOfWeek(viewingDate);
      } else if (todayDay === 6) {
        viewingDate = addDays(today, 2);
        viewingDate = getMondayOfWeek(viewingDate);
      }
      selectedDayIdx = 1;
    }

    renderHeader();
    renderDayTabs();
    renderSchedule();

    // Update current-class indicator every minute
    setInterval(() => {
      renderSchedule();
    }, 60000);
  }

  // ── DOM Ready ───────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM
    $onboarding         = document.getElementById('onboarding');
    $app                = document.getElementById('app');
    $dayTabs            = document.getElementById('day-tabs');
    $scheduleContainer  = document.getElementById('schedule-container');
    $weekType           = document.getElementById('week-type');
    $weekNumber         = document.getElementById('week-number');
    $weekBadge          = document.getElementById('week-badge');
    $groupChipLabel     = document.getElementById('group-chip-label');
    $modalOverlay       = document.getElementById('modal-overlay');
    $settingsBtn        = document.getElementById('settings-btn');
    $groupChip          = document.getElementById('group-chip');

    // Onboarding buttons
    document.querySelectorAll('.group-btn').forEach(btn => {
      btn.addEventListener('click', () => selectGroup(btn.dataset.group));
    });

    // Settings
    $settingsBtn.addEventListener('click', openModal);
    $groupChip.addEventListener('click', openModal);
    $modalOverlay.addEventListener('click', (e) => {
      if (e.target === $modalOverlay) closeModal();
    });
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.querySelectorAll('.modal-group-btn').forEach(btn => {
      btn.addEventListener('click', () => handleModalGroupChange(btn.dataset.group));
    });

    // Swipe gestures on schedule
    const main = document.getElementById('main-content');
    main.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    main.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    // Check if user already selected group
    if (selectedGroup) {
      $onboarding.style.display = 'none';
      $app.classList.remove('hidden');
      initApp();
    }
  });

})();
