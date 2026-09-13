/* =========================================================
   ПЛАНИРОВЩИК МАРШРУТА
   Управляет режимом расчёта: "сейчас" (по мск времени) или
   "запланировано" на конкретную дату/время.
   ========================================================= */

(function (M) {

  let mode = 'now';
  let plannedAbsMinutes = null;
  let plannedShiftedDay = null;

  let plannerToggle, plannerInputs, dateInput, timeInput;

  function recalcPlanned() {
    if (mode !== 'planned') return;
    if (!dateInput || !timeInput) return;
    const dateVal = dateInput.value;
    const timeVal = timeInput.value;
    if (!dateVal || !timeVal) {
      plannedAbsMinutes = null;
      plannedShiftedDay = null;
      return;
    }
    const absDay = M.dateToAbsDayIndex(dateVal);
    const [h, m] = timeVal.split(':').map(Number);
    plannedAbsMinutes = absDay * 1440 + h * 60 + m;
    plannedShiftedDay = ((absDay % 7) + 7 + 3) % 7;
  }

  function updateVisibility() {
    if (mode === 'planned') plannerInputs.classList.add('visible');
    else plannerInputs.classList.remove('visible');
  }

  function updateTabStates() {
    plannerToggle.querySelectorAll('.planner-tab').forEach(btn => {
      if (btn.dataset.mode === mode) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  function prefillDefaults() {
    const now = M.getMoscowNow();
    const yyyy = now.year;
    const mm = String(now.month).padStart(2, '0');
    const dd = String(now.day).padStart(2, '0');
    const hh = String(Math.floor(now.minutesFromMidnight / 60)).padStart(2, '0');
    const mi = String(Math.floor(now.minutesFromMidnight % 60)).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
    timeInput.value = `${hh}:${mi}`;
  }

  function refreshAll() {
    M.updateRoute();
    if (M.liveTrains && M.liveTrains.refresh) M.liveTrains.refresh();
  }

  M.planner = {
    init: function () {
      plannerToggle = document.getElementById('plannerToggle');
      plannerInputs = document.getElementById('plannerInputs');
      dateInput = document.getElementById('plannerDate');
      timeInput = document.getElementById('plannerTime');

      if (!plannerToggle) return;

      prefillDefaults();
      recalcPlanned();

      plannerToggle.addEventListener('click', (e) => {
        const btn = e.target.closest('.planner-tab');
        if (!btn) return;
        mode = btn.dataset.mode;
        updateTabStates();
        updateVisibility();
        recalcPlanned();
        refreshAll();
      });

      dateInput.addEventListener('change', () => { recalcPlanned(); refreshAll(); });
      dateInput.addEventListener('input', () => { recalcPlanned(); refreshAll(); });
      timeInput.addEventListener('change', () => { recalcPlanned(); refreshAll(); });
      timeInput.addEventListener('input', () => { recalcPlanned(); refreshAll(); });

      updateTabStates();
      updateVisibility();
    },

    getNowAbs: function () {
      if (mode === 'planned' && plannedAbsMinutes != null) return plannedAbsMinutes;
      return M.getMoscowNow().absoluteMinutes;
    },

    getTodayShifted: function () {
      if (mode === 'planned' && plannedShiftedDay != null) return plannedShiftedDay;
      return M.getMoscowNow().shiftedDay;
    },

    getMode: () => mode,
    isPlanned: () => mode === 'planned' && plannedAbsMinutes != null
  };

})(window.CatWarMetro = window.CatWarMetro || {});