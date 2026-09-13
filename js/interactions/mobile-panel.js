/* =========================================================
   МОБИЛЬНАЯ НИЖНЯЯ ПАНЕЛЬ (свайп-ручка)
   ========================================================= */

(function (M) {

  let routePanel, panelHandle;
  let handleTouchStartY = 0, handleTouchMoved = 0;

  function setState(state) {
    if (!routePanel) return;
    routePanel.classList.remove('mob-collapsed', 'mob-medium', 'mob-expanded');
    routePanel.classList.add('mob-' + state);
  }

  function autoInit() {
    if (window.innerWidth > 700) return;
    const h = window.innerHeight;
    if (h < 500) setState('expanded');
    else setState('medium');
  }

  M.mobilePanel = {
    init: function () {
      routePanel = document.getElementById('routePanel');
      panelHandle = document.getElementById('panelHandle');

      if (panelHandle) {
        panelHandle.addEventListener('touchstart', (e) => {
          handleTouchStartY = e.touches[0].clientY;
          handleTouchMoved = 0;
          e.stopPropagation();
        }, { passive: true });

        panelHandle.addEventListener('touchmove', (e) => {
          handleTouchMoved = e.touches[0].clientY - handleTouchStartY;
          e.stopPropagation();
        }, { passive: true });

        panelHandle.addEventListener('touchend', (e) => {
          if (Math.abs(handleTouchMoved) < 20) {
            // Тап по ручке — цикл medium → expanded → collapsed → medium
            if (routePanel.classList.contains('mob-medium')) setState('expanded');
            else if (routePanel.classList.contains('mob-expanded')) setState('collapsed');
            else setState('medium');
          } else if (handleTouchMoved < -30) {
            // Свайп вверх
            if (routePanel.classList.contains('mob-collapsed')) setState('medium');
            else if (routePanel.classList.contains('mob-medium')) setState('expanded');
          } else if (handleTouchMoved > 30) {
            // Свайп вниз
            if (routePanel.classList.contains('mob-expanded')) setState('medium');
            else if (routePanel.classList.contains('mob-medium')) setState('collapsed');
          }
          e.stopPropagation();
        }, { passive: true });
      }

      autoInit();
    },

    setState: setState
  };

})(window.CatWarMetro = window.CatWarMetro || {});