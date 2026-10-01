// ============================================================
//  app.js — UniSchedule Application Logic
//  v2 — cu calendar academic și navigare pe săptămâni
// ============================================================

(function () {
  'use strict';

  // ── Constants ───────────────────────────────────────────
  const DAY_NAMES  = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  const DAY_SHORT  = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
  const DAY_KEYS   = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const MONTH_SHORT = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];

  // Week‑day indices that have schedule (Mon=1 … Fri=5)
  const WEEKDAYS = [1, 2, 3, 4, 5];

  // ── State ───────────────────────────────────────────────
  let selectedGroup     = localStorage.getItem('uniScheduleGroup') || null;
  let selectedDayIdx    = null;   // 0‑6 (JS getDay())
  let viewingDate       = null;   // Monday of the currently viewed week
  let semesterWeeks     = [];     // all weeks of the semester (generated)
  let currentWeekIndex  = 0;      // index in semesterWeeks of the viewing week
  let todayWeekIndex    = -1;     // index of today's week

  // ── DOM references ──────────────────────────────────────
  let $onboarding, $app, $dayTabs, $scheduleContainer;
  let $weekType, $weekNumber, $weekBadge;
  let $groupChipLabel, $modalOverlay;
  let $settingsBtn, $groupChip;
  let $calendarStrip, $periodLabel;

  // ── Academic Calendar Logic ─────────────────────────────

  /** Add days to a date (returns new Date). */
  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  /** Get Monday of the week containing `date`. */
  function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d);
    mon.setDate(diff);
    mon.setHours(0, 0, 0, 0);
    return mon;
  }

  /** Find which academic period a date falls in. */
  function findPeriod(date) {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0); // midday to avoid timezone edge

    for (const period of ACADEMIC_PERIODS) {
      const start = new Date(period.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(period.end);
      end.setHours(23, 59, 59, 999);

      if (d >= start && d <= end) return period;
    }
    return null;
  }

  /**
   * Generate all weeks of the semester with their metadata.
   * Returns: [{ monday, type, teachingWeek, isOdd, label }]
   */
  function generateSemesterWeeks() {
    const weeks = [];
    let monday = getMondayOfWeek(SEMESTER_START);
    const lastPeriod = ACADEMIC_PERIODS[ACADEMIC_PERIODS.length - 1];
    const endDate = new Date(lastPeriod.end);
    endDate.setDate(endDate.getDate() + 7);

    while (monday <= endDate) {
      const period = findPeriod(monday);

      if (!period) {
        monday = addDays(monday, 7);
        continue;
      }

      if (period.type === 'teaching') {
        // Calculate which teaching week this is
        const periodStart = getMondayOfWeek(period.start);
        const diffMs = monday.getTime() - periodStart.getTime();
        const weekOffset = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
        const teachingWeek = period.teachingWeekStart + weekOffset;

        weeks.push({
          monday: new Date(monday),
          type: 'teaching',
          teachingWeek: teachingWeek,
          isOdd: teachingWeek % 2 !== 0,
          label: `Săptămâna ${teachingWeek}`
        });
      } else {
        weeks.push({
          monday: new Date(monday),
          type: period.type,
          teachingWeek: null,
          isOdd: null,
          label: period.label
        });
      }

      monday = addDays(monday, 7);
    }

    return weeks;
  }

  /** Find the semester week index for a given date. Returns -1 if not found. */
  function findWeekIndex(date) {
    const d = getMondayOfWeek(date);
    d.setHours(0, 0, 0, 0);

    for (let i = 0; i < semesterWeeks.length; i++) {
      const wm = new Date(semesterWeeks[i].monday);
      wm.setHours(0, 0, 0, 0);
      if (wm.getTime() === d.getTime()) return i;
    }
    return -1;
  }

  /** Get week info for the currently viewed week. */
  function getCurrentWeekInfo() {
    if (currentWeekIndex >= 0 && currentWeekIndex < semesterWeeks.length) {
      return semesterWeeks[currentWeekIndex];
    }
    // Fallback for dates outside the semester
    return {
      monday: viewingDate,
      type: 'outside',
      teachingWeek: null,
      isOdd: null,
      label: 'În afara semestrului'
    };
  }

  // ── Time Helpers ────────────────────────────────────────

  /** Parse start time from "08:00 – 10:00" → { h, m } */
  function parseTime(str) {
    const match = str.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return { h: parseInt(match[1], 10), m: parseInt(match[2], 10) };
  }

  /** Parse end time from "08:00 – 10:00" → { h, m } */
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

    // Only highlight if viewing today's actual date
    const viewDay = addDays(viewingDate, selectedDayIdx - 1);
    viewDay.setHours(0, 0, 0, 0);
    if (today.getTime() !== viewDay.getTime()) return false;

    const start = parseTime(timeStr);
    const end   = parseEndTime(timeStr);
    if (!start || !end) return false;

    const nowMin   = now.getHours() * 60 + now.getMinutes();
    const startMin = start.h * 60 + start.m;
    const endMin   = end.h * 60 + end.m;

    return nowMin >= startMin && nowMin < endMin;
  }

  /** Get greeting based on time of day. */
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 6)  return 'Noapte bună ✨';
    if (h < 12) return 'Bună dimineața ☀️';
    if (h < 18) return 'Bună ziua 👋';
    return 'Bună seara 🌙';
  }

  /** Format date for day tab. */
  function getDateForDay(mondayDate, dayIdx) {
    return addDays(mondayDate, dayIdx - 1);
  }

  // ── Rendering ───────────────────────────────────────────

  /** Render the calendar week strip. */
  function renderCalendarStrip() {
    $calendarStrip.innerHTML = '';

    semesterWeeks.forEach((week, index) => {
      const pill = document.createElement('button');
      pill.className = 'cal-pill';
      pill.dataset.index = index;

      // Type class
      pill.classList.add('cal-' + week.type);

      // Active (currently viewing)
      if (index === currentWeekIndex) pill.classList.add('active');

      // Today's week
      if (index === todayWeekIndex) pill.classList.add('today');

      // Content
      let label = '';
      let sublabel = '';
      const dayNum = week.monday.getDate();
      const monthStr = MONTH_SHORT[week.monday.getMonth()];

      if (week.type === 'teaching') {
        label = `S${week.teachingWeek}`;
        sublabel = `${dayNum} ${monthStr}`;
      } else if (week.type === 'vacation') {
        label = '🏖️';
        sublabel = `${dayNum} ${monthStr}`;
      } else if (week.type === 'exams') {
        label = '📝';
        sublabel = `${dayNum} ${monthStr}`;
      }

      pill.innerHTML = `
        <span class="cal-pill-label">${label}</span>
        <span class="cal-pill-date">${sublabel}</span>
      `;

      pill.addEventListener('click', () => {
        navigateToWeek(index);
      });

      $calendarStrip.appendChild(pill);
    });

    // Scroll active pill into view
    requestAnimationFrame(() => {
      const activePill = $calendarStrip.querySelector('.cal-pill.active');
      if (activePill) {
        activePill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }

  /** Navigate to a specific semester week by index. */
  function navigateToWeek(index) {
    if (index < 0 || index >= semesterWeeks.length) return;

    currentWeekIndex = index;
    viewingDate = new Date(semesterWeeks[index].monday);

    // If navigating to a different week, default to Monday
    const today = new Date();
    const todayMon = getMondayOfWeek(today);
    todayMon.setHours(0, 0, 0, 0);
    const viewMon = new Date(viewingDate);
    viewMon.setHours(0, 0, 0, 0);

    if (todayMon.getTime() === viewMon.getTime()) {
      // Same week as today — select today
      const todayDay = today.getDay();
      selectedDayIdx = (todayDay >= 1 && todayDay <= 5) ? todayDay : 1;
    } else {
      selectedDayIdx = 1; // default to Monday
    }

    renderAll();
  }

  /** Render the week info banner. */
  function renderWeekBanner() {
    const info = getCurrentWeekInfo();

    if (info.type === 'teaching') {
      $weekType.textContent   = info.isOdd ? 'Săptămâna Impară' : 'Săptămâna Pară';
      $weekNumber.textContent = `Săptămâna ${info.teachingWeek} din 14`;
      $weekBadge.textContent  = info.isOdd ? 'Impară' : 'Pară';
      $weekBadge.className    = 'week-badge ' + (info.isOdd ? 'odd' : 'even');
    } else if (info.type === 'vacation') {
      $weekType.textContent   = info.label;
      $weekNumber.textContent = 'Nu se numără săptămânile didactice';
      $weekBadge.textContent  = 'Vacanță';
      $weekBadge.className    = 'week-badge vacation';
    } else if (info.type === 'exams') {
      $weekType.textContent   = info.label;
      $weekNumber.textContent = 'Perioadă de examene';
      $weekBadge.textContent  = 'Sesiune';
      $weekBadge.className    = 'week-badge exams';
    } else {
      $weekType.textContent   = 'În afara semestrului';
      $weekNumber.textContent = '';
      $weekBadge.textContent  = '—';
      $weekBadge.className    = 'week-badge';
    }
  }

  /** Render day tabs. */
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

  /** Render the schedule cards. */
  function renderSchedule() {
    renderWeekBanner();

    const info = getCurrentWeekInfo();

    // ── Non-teaching weeks: show special state ──
    if (info.type === 'vacation') {
      $scheduleContainer.innerHTML = `
        <div class="empty-state">
          <div class="emoji">🏖️</div>
          <h3>${info.label}</h3>
          <p>Fără ore în această perioadă. Odihnește‑te și reîncarcă bateriile!</p>
        </div>
      `;
      return;
    }

    if (info.type === 'exams') {
      $scheduleContainer.innerHTML = `
        <div class="empty-state">
          <div class="emoji">📝</div>
          <h3>${info.label}</h3>
          <p>Perioadă de sesiune. Mult succes la examene!</p>
        </div>
      `;
      return;
    }

    if (info.type === 'outside') {
      $scheduleContainer.innerHTML = `
        <div class="empty-state">
          <div class="emoji">📅</div>
          <h3>În afara semestrului</h3>
          <p>Această săptămână nu face parte din semestrul curent.</p>
        </div>
      `;
      return;
    }

    // ── Teaching week: show filtered schedule ──
    const dayKey  = DAY_KEYS[selectedDayIdx];
    const dayData = scheduleData[dayKey] || [];

    const filtered = dayData.filter(item => {
      const groupMatch = item.group === 'all' || item.group === selectedGroup;
      const weekMatch  = item.week === 'all'
        || (item.week === 'odd'  && info.isOdd)
        || (item.week === 'even' && !info.isOdd);
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

    // Animate in
    $scheduleContainer.classList.remove('fade-enter');
    void $scheduleContainer.offsetWidth;
    $scheduleContainer.classList.add('fade-enter');

    filtered.forEach(item => {
      const card = document.createElement('div');
      const typeClass   = 'type-' + item.type;
      const currentCls  = isCurrentClass(item.time) ? ' is-current' : '';
      card.className    = `schedule-card ${typeClass}${currentCls}`;

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

  /** Render header. */
  function renderHeader() {
    document.getElementById('header-greeting').textContent = getGreeting();
    $groupChipLabel.textContent = `Grupa ${selectedGroup}`;
  }

  /** Full re‑render of all dynamic parts. */
  function renderAll() {
    renderHeader();
    renderCalendarStrip();
    renderDayTabs();
    renderSchedule();
  }

  // ── Modal (Settings) ───────────────────────────────────

  function openModal() {
    $modalOverlay.classList.add('visible');
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

    const ci = WEEKDAYS.indexOf(selectedDayIdx);

    if (diff > 0) {
      // Swipe left → next day
      if (ci < WEEKDAYS.length - 1) {
        selectedDayIdx = WEEKDAYS[ci + 1];
      } else {
        // Next week
        const next = currentWeekIndex + 1;
        if (next < semesterWeeks.length) {
          navigateToWeek(next);
          selectedDayIdx = WEEKDAYS[0];
        }
      }
    } else {
      // Swipe right → prev day
      if (ci > 0) {
        selectedDayIdx = WEEKDAYS[ci - 1];
      } else {
        // Prev week
        const prev = currentWeekIndex - 1;
        if (prev >= 0) {
          navigateToWeek(prev);
          selectedDayIdx = WEEKDAYS[WEEKDAYS.length - 1];
        }
      }
    }

    renderDayTabs();
    renderSchedule();
  }

  // ── Init ────────────────────────────────────────────────

  function initApp() {
    // Generate all semester weeks
    semesterWeeks = generateSemesterWeeks();

    // Find today's week
    const today = new Date();
    todayWeekIndex = findWeekIndex(today);

    if (todayWeekIndex >= 0) {
      currentWeekIndex = todayWeekIndex;
      viewingDate = new Date(semesterWeeks[currentWeekIndex].monday);
    } else {
      // If outside semester, default to first week
      currentWeekIndex = 0;
      viewingDate = new Date(semesterWeeks[0].monday);
    }

    // Select today's day if it's a weekday
    const todayDay = today.getDay();
    if (todayWeekIndex >= 0 && todayDay >= 1 && todayDay <= 5) {
      selectedDayIdx = todayDay;
    } else {
      selectedDayIdx = 1;
    }

    renderAll();

    // Refresh every minute (for "ACUM" badge)
    setInterval(() => renderSchedule(), 60000);
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
    $calendarStrip      = document.getElementById('calendar-strip');

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

    // Swipe
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
