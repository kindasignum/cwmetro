/* =========================================================
   ПАНЕЛЬ МАРШРУТА: поля выбора, dropdown, swap, clear
   ========================================================= */

(function (M) {

  let startId = null;
  let endId = null;

  // DOM
  let fromBtn, toBtn, fromLabel, toLabel, fromMarker, toMarker;
  let fromClear, toClear, fromDropdown, toDropdown, swapBtn, routeSummary;

  const sortedStations = () => [...M.stationsData].sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  // Отрисовка поля (маркер, текст, крестик)
  function updateFieldUI(which) {
    const isFrom = which === 'from';
    const id = isFrom ? startId : endId;
    const label = isFrom ? fromLabel : toLabel;
    const marker = isFrom ? fromMarker : toMarker;
    const clearBtn = isFrom ? fromClear : toClear;

    if (id) {
      const st = M.stationsData.find(s => s.id === id);
      label.textContent = st.name;
      label.classList.remove('placeholder');
      marker.classList.remove('empty');
      marker.style.background = M.LINE_COLORS[st.lines[0]];
      clearBtn.classList.add('visible');
    } else {
      label.textContent = isFrom ? 'Откуда' : 'Куда';
      label.classList.add('placeholder');
      marker.classList.add('empty');
      marker.style.background = '';
      clearBtn.classList.remove('visible');
    }
  }

  // Строит список станций в выпадашке
  function buildDropdown(dropdown, excludeId, currentId) {
    dropdown.innerHTML = '';
    sortedStations().forEach(st => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.dataset.id = st.id;
      if (st.id === excludeId) item.classList.add('disabled');
      if (st.id === currentId) item.classList.add('selected');

      const linesWrap = document.createElement('span');
      linesWrap.className = 'item-lines';
      st.lines.forEach(l => {
        const dot = document.createElement('span');
        dot.className = 'line-dot';
        dot.style.background = M.LINE_COLORS[l];
        linesWrap.appendChild(dot);
      });
      item.appendChild(linesWrap);

      const name = document.createElement('span');
      name.className = 'item-name';
      name.textContent = st.name;
      item.appendChild(name);

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        if (item.classList.contains('disabled')) return;
        if (dropdown === fromDropdown) M.routePanel.setStart(st.id);
        else M.routePanel.setEnd(st.id);
        closeAllDropdowns();
        M.updateRoute();
      });

      dropdown.appendChild(item);
    });
  }

  function closeAllDropdowns() {
    fromDropdown.classList.remove('open');
    toDropdown.classList.remove('open');
    fromBtn.classList.remove('open');
    toBtn.classList.remove('open');
  }

  // Публичное API
  M.routePanel = {
    init: function () {
      fromBtn = document.getElementById('fromBtn');
      toBtn = document.getElementById('toBtn');
      fromLabel = document.getElementById('fromLabel');
      toLabel = document.getElementById('toLabel');
      fromMarker = document.getElementById('fromMarker');
      toMarker = document.getElementById('toMarker');
      fromClear = document.getElementById('fromClear');
      toClear = document.getElementById('toClear');
      fromDropdown = document.getElementById('fromDropdown');
      toDropdown = document.getElementById('toDropdown');
      swapBtn = document.getElementById('swapBtn');
      routeSummary = document.getElementById('routeSummary');

      // Открытие выпадашек
      fromBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = fromDropdown.classList.contains('open');
        closeAllDropdowns();
        if (!isOpen) {
          buildDropdown(fromDropdown, endId, startId);
          fromDropdown.classList.add('open');
          fromBtn.classList.add('open');
        }
      });
      toBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = toDropdown.classList.contains('open');
        closeAllDropdowns();
        if (!isOpen) {
          buildDropdown(toDropdown, startId, endId);
          toDropdown.classList.add('open');
          toBtn.classList.add('open');
        }
      });

      // Закрытие по клику/тапу вне
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.route-field')) closeAllDropdowns();
      });
      document.addEventListener('touchstart', (e) => {
        if (!e.target.closest('.route-field')) closeAllDropdowns();
      }, { passive: true });

      // Крестики
      fromClear.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        startId = null;
        closeAllDropdowns();
        M.updateRoute();
      });
      toClear.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        endId = null;
        closeAllDropdowns();
        M.updateRoute();
      });

      // Смена направления
      swapBtn.addEventListener('click', () => {
        const tmp = startId;
        startId = endId;
        endId = tmp;
        closeAllDropdowns();
        M.updateRoute();
      });

      this.refreshUI();
    },

    refreshUI: function () {
      updateFieldUI('from');
      updateFieldUI('to');

      if (startId && endId) {
        const a = M.stationsData.find(s => s.id === startId);
        const b = M.stationsData.find(s => s.id === endId);
        routeSummary.textContent = `${a.name} → ${b.name}`;
      } else if (startId) {
        routeSummary.textContent = 'Выберите станцию назначения';
      } else if (endId) {
        routeSummary.textContent = 'Выберите станцию отправления';
      } else {
        routeSummary.textContent = 'Выберите станции';
      }
    },

    getStart: () => startId,
    getEnd: () => endId,
    setStart: (id) => { startId = id; },
    setEnd: (id) => { endId = id; },

    // Логика клика по станции на карте
    handleStationClick: function (id) {
      if (startId && endId) {
        startId = id;
        endId = null;
      } else if (!startId) {
        startId = id;
      } else if (!endId) {
        if (startId === id) return;
        endId = id;
      } else {
        startId = id;
        endId = null;
      }
      M.updateRoute();
    },

    closeAllDropdowns: closeAllDropdowns
  };

})(window.CatWarMetro = window.CatWarMetro || {});