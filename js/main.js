/* =========================================================
   ГЛАВНЫЙ МОДУЛЬ: инициализация и связка всего
   ========================================================= */

(function (M) {

  M.updateRoute = function () {
    M.routePanel.refreshUI();

    const startId = M.routePanel.getStart();
    const endId = M.routePanel.getEnd();

    if (startId && endId) {
      const nowAbs = M.planner.getNowAbs();
      const todayShifted = M.planner.getTodayShifted();
      const best = M.findBestRoute(startId, endId, nowAbs);

      M.routeDetails.show(best, nowAbs, todayShifted);

      if (best && best.steps) {
        M.routeHighlight.apply(best.steps);
      } else {
        M.routeHighlight.clear();
      }
    } else {
      M.routeHighlight.clear();
      M.routeDetails.hide();
    }

    if (M.liveTrains && M.liveTrains.refresh) M.liveTrains.refresh();
  };

  function init() {
    M.theme.init();
    M.routePanel.init();
    M.planner.init();
    M.routeDetails.init();
    M.panZoom.init();
    M.routeHighlight.init();
    M.mobilePanel.init();

    document.querySelectorAll('.station').forEach(el => {
      el.addEventListener('click', (e) => {
        M.routePanel.handleStationClick(e.currentTarget.dataset.id);
      });
      el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        M.routePanel.handleStationClick(e.currentTarget.dataset.id);
      });
    });

    M.liveTrains.init();

    setInterval(() => {
      const startId = M.routePanel.getStart();
      const endId = M.routePanel.getEnd();
      if (startId && endId) {
        if (!M.planner.isPlanned()) M.updateRoute();
      }
    }, 30000);

    M.updateRoute();

    window.metroApp = {
      get stationsData() { return M.stationsData; },
      get graph() { return M.graph; },
      get lines() { return M.lines; },
      get allTrips() { return M.allTrips; },
      getSelected: () => ({
        startId: M.routePanel.getStart(),
        endId: M.routePanel.getEnd()
      }),
      setRoute: (a, b) => {
        M.routePanel.setStart(a);
        M.routePanel.setEnd(b);
        M.updateRoute();
      },
      setPlanner: (mode, dateStr, timeStr) => {
        if (mode === 'now') {
          document.querySelector('.planner-tab[data-mode="now"]').click();
        } else if (mode === 'planned') {
          document.getElementById('plannerDate').value = dateStr || '';
          document.getElementById('plannerTime').value = timeStr || '';
          document.querySelector('.planner-tab[data-mode="planned"]').click();
        }
      },
      refreshTrains: () => M.liveTrains.refresh(),
      updateRoute: M.updateRoute
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window.CatWarMetro = window.CatWarMetro || {});