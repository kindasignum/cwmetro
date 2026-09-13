/* =========================================================
   ПОЕЗДА В РЕАЛЬНОМ ВРЕМЕНИ
   Плавная анимация движения + умное обновление.
   ========================================================= */

(function (M) {

  let trainsLayer, tooltipLayer, svgEl;
  let updateTimer = null;
  let selectedTripId = null;

  // Хранилище активных пинов: Map<lineName, { el, data, lastX, lastY, isStation }>
  const pinNodes = new Map();

  // Границы viewBox
  const VIEWBOX_W = 1500;
  const VIEWBOX_H = 950;

  // Интервалы обновления
  const INTERVAL_IDLE = 3000;    // когда тултип не открыт
  const INTERVAL_FOCUSED = 1000; // когда открыт тултип
  const ANIM_MS = 900;           // длительность анимации пина

  const tripIds = new WeakMap();
  let nextTripId = 1;

  function getTripId(trip) {
    if (!tripIds.has(trip)) tripIds.set(trip, nextTripId++);
    return tripIds.get(trip);
  }

  function getStation(id) {
    return M.stationsData.find(s => s.id === id);
  }

  function getStationCoords(stationId, lineName) {
    const st = getStation(stationId);
    if (!st) return null;
    if (st.lineCoords && st.lineCoords[lineName]) return st.lineCoords[lineName];
    return { x: st.x, y: st.y };
  }

  function isInDepot(lineName, nowAbs) {
    const depot = M.DEPOT_HOURS && M.DEPOT_HOURS[lineName];
    if (!depot) return false;
    const minutesInDay = ((nowAbs % 1440) + 1440) % 1440;
    if (depot.start < depot.end) {
      return minutesInDay >= depot.start && minutesInDay < depot.end;
    } else {
      return minutesInDay >= depot.start || minutesInDay < depot.end;
    }
  }

  function computeTripPosition(trip, nowAbs) {
    const stops = trip.stops;
    const tripAbsDay = Math.floor(nowAbs / 1440);

    const isTripActiveToday = (dayIdx) => {
      if (trip.absDays) return trip.absDays.includes(dayIdx);
      if (trip.days) {
        const shifted = ((dayIdx % 7) + 7 + 3) % 7;
        return trip.days.includes(shifted);
      }
      return true;
    };

    for (const offset of [0, -1, -2, -3, -4, -5]) {
      const dayStart = (tripAbsDay + offset) * 1440;
      if (!isTripActiveToday(tripAbsDay + offset)) continue;

      const absTimes = [];
      for (let i = 0; i < stops.length; i++) {
        const s = stops[i];
        const arriveAbs = s.arrive != null ? dayStart + s.arrive : null;
        const departAbs = s.depart != null ? dayStart + s.depart : null;
        absTimes.push({ arriveAbs, departAbs });
      }

      for (let i = 0; i < stops.length; i++) {
        const { arriveAbs, departAbs } = absTimes[i];
        if (arriveAbs != null && departAbs != null && nowAbs >= arriveAbs && nowAbs <= departAbs) {
          const coords = getStationCoords(stops[i].station, trip.line);
          const nextStop = stops[i + 1];
          const nextArriveAbs = nextStop && absTimes[i + 1] ? absTimes[i + 1].arriveAbs : null;
          return {
            type: 'station',
            stationId: stops[i].station,
            x: coords.x, y: coords.y,
            nextStationId: nextStop ? nextStop.station : null,
            nextArriveAbs,
            departAbs,
            arriveAbs
          };
        }
      }

      for (let i = 0; i < stops.length - 1; i++) {
        const departFrom = absTimes[i].departAbs;
        const arriveTo = absTimes[i + 1].arriveAbs;
        if (departFrom == null || arriveTo == null) continue;
        if (nowAbs > departFrom && nowAbs < arriveTo) {
          const fromId = stops[i].station;
          const toId = stops[i + 1].station;
          const fromCoords = getStationCoords(fromId, trip.line);
          const toCoords = getStationCoords(toId, trip.line);
          const progress = (nowAbs - departFrom) / (arriveTo - departFrom);
          return {
            type: 'enroute',
            fromId, toId,
            x: fromCoords.x + (toCoords.x - fromCoords.x) * progress,
            y: fromCoords.y + (toCoords.y - fromCoords.y) * progress,
            progress,
            nextStationId: toId,
            nextArriveAbs: arriveTo,
            departAbs: departFrom
          };
        }
      }
    }

    return null;
  }

  function findNextTrip(lineName, nowAbs) {
    let best = null;
    for (const trip of M.allTrips) {
      if (trip.line !== lineName) continue;
      const stops = trip.stops;
      if (!stops.length) continue;
      const startStop = stops[0];
      if (startStop.depart == null) continue;

      const currentDay = Math.floor(nowAbs / 1440);
      for (let offset = 0; offset <= 14; offset++) {
        const candDay = currentDay + offset;
        if (!M.tripWorksOnDay(trip, candDay)) continue;
        const departAbs = candDay * 1440 + startStop.depart;
        if (departAbs <= nowAbs) continue;
        if (!best || departAbs < best.boardingTime) {
          best = {
            trip,
            boardingTime: departAbs,
            startStation: startStop.station,
            nextStation: stops[1] ? stops[1].station : null
          };
        }
        break;
      }
    }
    return best;
  }

  function createPinIcon(lineColor) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'train-pin-icon');

    const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    body.setAttribute('x', -6); body.setAttribute('y', -5);
    body.setAttribute('width', 12); body.setAttribute('height', 9);
    body.setAttribute('rx', 2); body.setAttribute('ry', 2);
    body.setAttribute('fill', lineColor);
    g.appendChild(body);

    const win = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    win.setAttribute('x', -4); win.setAttribute('y', -3.5);
    win.setAttribute('width', 8); win.setAttribute('height', 3.5);
    win.setAttribute('rx', 1); win.setAttribute('fill', '#ffffff'); win.setAttribute('opacity', 0.9);
    g.appendChild(win);

    const lampL = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    lampL.setAttribute('cx', -3); lampL.setAttribute('cy', 2); lampL.setAttribute('r', 1);
    lampL.setAttribute('fill', '#ffffff'); g.appendChild(lampL);

    const lampR = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    lampR.setAttribute('cx', 3); lampR.setAttribute('cy', 2); lampR.setAttribute('r', 1);
    lampR.setAttribute('fill', '#ffffff'); g.appendChild(lampR);

    return g;
  }

  function createPinMarker(line, isActive) {
    const lineColor = M.LINE_COLORS[line] || '#333';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'train-pin' + (isActive ? ' active' : ''));
    g.setAttribute('data-line', line);

    const body = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    body.setAttribute('d', 'M 0 0 L -5.5 -9 A 9 9 0 1 1 5.5 -9 Z');
    body.setAttribute('fill', lineColor);
    body.setAttribute('stroke', 'white');
    body.setAttribute('stroke-width', 1.5);
    body.setAttribute('stroke-linejoin', 'round');
    body.setAttribute('class', 'train-pin-body');
    g.appendChild(body);

    const iconG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    iconG.setAttribute('transform', 'translate(0, -13)');
    iconG.appendChild(createPinIcon(lineColor));
    g.appendChild(iconG);

    return g;
  }

  function fmtTime(absMinutes) {
    const minutesInDay = ((absMinutes % 1440) + 1440) % 1440;
    const h = Math.floor(minutesInDay / 60);
    const m = Math.floor(minutesInDay % 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  function fmtDuration(mins) {
    mins = Math.max(0, Math.round(mins));
    if (mins < 1) return 'меньше минуты';
    if (mins < 60) return mins + ' мин';
    const h = Math.floor(mins / 60), m = mins % 60;
    if (m === 0) return h + ' ч';
    return h + ' ч ' + m + ' мин';
  }

  function estimateTextWidth(text, fontSize) {
    return Math.ceil(text.length * fontSize * 0.58);
  }

  function buildStopText(data) {
    const currentId = data.stationId;
    const nextId = data.nextStationId;
    const departAbs = data.departAbs;
    const boardingTime = data.boardingTime;

    let directionText;
    if (nextId) {
      directionText = `${getStation(currentId).name} → ${getStation(nextId).name}`;
    } else {
      directionText = getStation(currentId).name;
    }

    const stateText = 'Стоит в ожидании рейса: ' + (nextId ? getStation(nextId).name : getStation(currentId).name);

    const departTime = departAbs != null ? departAbs : boardingTime;
    let line2 = '';
    if (departTime != null) {
      const now = (M.planner && M.planner.getNowAbs) ? M.planner.getNowAbs() : M.getMoscowNow().absoluteMinutes;
      line2 = 'Выезд в ' + fmtTime(departTime) + ' (через ' + fmtDuration(departTime - now) + ')';
    }

    return { directionText, stateText, line2 };
  }

  function createTooltip(x, y, data, nowAbs) {
    tooltipLayer.innerHTML = '';
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'train-tooltip');

    let directionText = '';
    let stateText = '';
    let line2 = '';

    if (data.type === 'station' || data.type === 'idle') {
      const info = buildStopText(data);
      directionText = info.directionText;
      stateText = info.stateText;
      line2 = info.line2;
    } else {
      const fromName = getStation(data.fromId).name;
      const toName = getStation(data.toId).name;
      directionText = `${fromName} → ${toName}`;
      stateText = 'В пути';
      const timeToArrive = data.nextArriveAbs - nowAbs;
      line2 = 'Прибытие в ' + getStation(data.nextStationId).name + ' в ' + fmtTime(data.nextArriveAbs) + ' (через ' + fmtDuration(timeToArrive) + ')';
    }

    const PADDING = 16;
    const TITLE_FONT = 12;
    const TEXT_FONT = 11;
    const wTitle = estimateTextWidth(directionText, TITLE_FONT);
    const wState = estimateTextWidth(stateText, TEXT_FONT);
    const wLine2 = estimateTextWidth(line2, TEXT_FONT);
    const width = Math.max(180, Math.min(500, Math.max(wTitle, wState, wLine2) + PADDING * 2));
    const height = 80;

    let tipX = x - width / 2;
    if (tipX < 4) tipX = 4;
    if (tipX + width > VIEWBOX_W - 4) tipX = VIEWBOX_W - 4 - width;

    let tipY = y - height - 30;
    if (tipY < 4) tipY = y + 30;
    if (tipY + height > VIEWBOX_H - 4) tipY = VIEWBOX_H - 4 - height;

    const centerX = tipX + width / 2;

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', tipX); bg.setAttribute('y', tipY);
    bg.setAttribute('width', width); bg.setAttribute('height', height);
    bg.setAttribute('rx', 10); bg.setAttribute('ry', 10);
    bg.setAttribute('class', 'train-tooltip-bg');
    g.appendChild(bg);

    const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleEl.setAttribute('x', centerX); titleEl.setAttribute('y', tipY + 22);
    titleEl.setAttribute('class', 'train-tooltip-title');
    titleEl.textContent = directionText;
    g.appendChild(titleEl);

    const stateEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    stateEl.setAttribute('x', centerX); stateEl.setAttribute('y', tipY + 42);
    stateEl.setAttribute('class', 'train-tooltip-text');
    stateEl.textContent = stateText;
    g.appendChild(stateEl);

    const line2El = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    line2El.setAttribute('x', centerX); line2El.setAttribute('y', tipY + 60);
    line2El.setAttribute('class', 'train-tooltip-text');
    line2El.textContent = line2;
    g.appendChild(line2El);

    tooltipLayer.appendChild(g);
  }

  // Пересчёт позиций всех поездов. Возвращает Map<line, {trip, pos, kind}>.
  function computeActiveByLine(nowAbs) {
    const byLine = new Map();

    for (const trip of M.allTrips) {
      const pos = computeTripPosition(trip, nowAbs);
      if (!pos) continue;
      const line = trip.line;
      const prev = byLine.get(line);
      if (!prev) {
        byLine.set(line, { kind: 'active', trip, pos });
      } else {
        const prevIsEnroute = prev.kind === 'active' && prev.pos.type === 'enroute';
        const currIsEnroute = pos.type === 'enroute';
        if (currIsEnroute && !prevIsEnroute) {
          byLine.set(line, { kind: 'active', trip, pos });
        }
      }
    }

    for (const lineName of Object.keys(M.lines)) {
      if (byLine.has(lineName)) continue;
      if (isInDepot(lineName, nowAbs)) continue;

      const nextTrip = findNextTrip(lineName, nowAbs);
      if (!nextTrip) continue;

      const coords = getStationCoords(nextTrip.startStation, lineName);
      byLine.set(lineName, {
        kind: 'idle',
        trip: nextTrip.trip,
        pos: {
          type: 'idle',
          stationId: nextTrip.startStation,
          x: coords.x,
          y: coords.y,
          boardingTime: nextTrip.boardingTime,
          nextStationId: nextTrip.nextStation,
          nextArriveAbs: null,
          departAbs: nextTrip.boardingTime,
          arriveAbs: null
        }
      });
    }

    return byLine;
  }

  // Основной тик: обновляет существующие пины, добавляет новые, удаляет исчезнувшие.
  function tick() {
    if (!trainsLayer) return;

    const nowAbs = (M.planner && M.planner.getNowAbs) ? M.planner.getNowAbs() : M.getMoscowNow().absoluteMinutes;

    const activeByLine = computeActiveByLine(nowAbs);

    const routeLines = M.routeHighlight ? M.routeHighlight.getActiveLines() : null;
    const hasRoute = routeLines && routeLines.size > 0;

    const seenLines = new Set();

    for (const [lineName, data] of activeByLine) {
      seenLines.add(lineName);
      const isActive = !hasRoute || routeLines.has(lineName);

      let node = pinNodes.get(lineName);

      // Если нет — создаём
      if (!node) {
        const marker = createPinMarker(lineName, isActive);
        if (!isActive) marker.classList.add('dim');

        // Первичная установка позиции без анимации
        marker.style.transition = 'none';
        marker.setAttribute('transform', `translate(${data.pos.x}, ${data.pos.y})`);
        // Снимаем transition после кадра
        requestAnimationFrame(() => {
          marker.style.transition = '';
        });

        marker.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = getTripId(data.trip);
          if (selectedTripId === id) {
            selectedTripId = null;
            tooltipLayer.innerHTML = '';
            restartTimer();
          } else {
            selectedTripId = id;
            const currentAbs = (M.planner && M.planner.getNowAbs) ? M.planner.getNowAbs() : M.getMoscowNow().absoluteMinutes;
            const freshPos = computeTripPosition(data.trip, currentAbs) || data.pos;
            createTooltip(freshPos.x, freshPos.y, {
              ...freshPos,
              trip: data.trip
            }, currentAbs);
            restartTimer();
          }
        });
        marker.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
        marker.addEventListener('touchend', (e) => {
          e.preventDefault();
          e.stopPropagation();
          marker.dispatchEvent(new Event('click'));
        });

        trainsLayer.appendChild(marker);
        node = {
          el: marker,
          data: null,
          lastX: data.pos.x,
          lastY: data.pos.y,
          isActive
        };
        pinNodes.set(lineName, node);
      }

      // Обновляем класс активности
      if (node.isActive !== isActive) {
        node.isActive = isActive;
        if (isActive) node.el.classList.remove('dim');
        else node.el.classList.add('dim');
      }

      // Обновляем trip (для клика)
      node.trip = data.trip;
      node.kind = data.kind;
      node.pos = data.pos;

      // Позиция: анимируем плавно, если двигаемся; мгновенно, если перескочили на станцию
      const dx = data.pos.x - node.lastX;
      const dy = data.pos.y - node.lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Если пин «в пути» — анимируем. Если это станция — короткая анимация.
      const isStationNow = data.pos.type === 'station' || data.pos.type === 'idle';
      const wasStation = node.pos && (node.pos.type === 'station' || node.pos.type === 'idle');

      if (dist > 0.5) {
        if (isStationNow && !wasStation) {
          // Переход «в пути → на станцию» — быстрая анимация, чтобы «доезд» был короткий
          node.el.classList.add('station-jump');
          node.el.setAttribute('transform', `translate(${data.pos.x}, ${data.pos.y})`);
          setTimeout(() => {
            if (node.el) node.el.classList.remove('station-jump');
          }, 200);
        } else {
          node.el.setAttribute('transform', `translate(${data.pos.x}, ${data.pos.y})`);
        }
        node.lastX = data.pos.x;
        node.lastY = data.pos.y;
      }
    }

    // Удаляем пины для линий, которых больше нет в активных
    for (const [lineName, node] of pinNodes) {
      if (!seenLines.has(lineName)) {
        node.el.remove();
        pinNodes.delete(lineName);
      }
    }

    // Тултип: обновляем позицию, если открыт
    if (selectedTripId != null) {
      let found = null;
      for (const [lineName, data] of activeByLine) {
        if (getTripId(data.trip) === selectedTripId) {
          found = data;
          break;
        }
      }
      if (found) {
        createTooltip(found.pos.x, found.pos.y, {
          ...found.pos,
          trip: found.trip
        }, nowAbs);
      } else {
        selectedTripId = null;
        tooltipLayer.innerHTML = '';
      }
    }
  }

  // Таймер с адаптивным интервалом
  function restartTimer() {
    if (updateTimer) clearInterval(updateTimer);
    const interval = selectedTripId != null ? INTERVAL_FOCUSED : INTERVAL_IDLE;
    updateTimer = setInterval(() => {
      if (document.hidden) return;
      tick();
    }, interval);
  }

  M.liveTrains = {
    init: function () {
      svgEl = document.getElementById('metroSvg');
      trainsLayer = document.getElementById('trainsLayer');
      tooltipLayer = document.getElementById('trainTooltipLayer');
      if (!trainsLayer) return;

      // Первый тик + запуск таймера
      tick();
      restartTimer();

      // При возврате на вкладку — обновляем сразу
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) tick();
      });

      // Клик по пустому месту — закрываем тултип
      document.addEventListener('click', (e) => {
        if (e.target.closest('.train-pin')) return;
        if (selectedTripId != null) {
          selectedTripId = null;
          tooltipLayer.innerHTML = '';
          restartTimer();
        }
      });
      document.addEventListener('touchstart', (e) => {
        if (e.target.closest('.train-pin')) return;
        if (selectedTripId != null) {
          selectedTripId = null;
          tooltipLayer.innerHTML = '';
          restartTimer();
        }
      }, { passive: true });
    },

    refresh: function () {
      tick();
      restartTimer();
    },

    hide: function () {
      if (trainsLayer) trainsLayer.classList.add('hidden');
      if (tooltipLayer) tooltipLayer.innerHTML = '';
      selectedTripId = null;
    },

    show: function () {
      if (trainsLayer) trainsLayer.classList.remove('hidden');
      tick();
      restartTimer();
    }
  };

})(window.CatWarMetro = window.CatWarMetro || {});