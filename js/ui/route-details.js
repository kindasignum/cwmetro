/* =========================================================
   БЛОК ТАЙМИНГА МАРШРУТА И ДЕТАЛИ МАРШРУТА
   ========================================================= */

(function (M) {

  let routeTiming, departureTimeEl, arrivalTimeEl, waitDurationEl, routeDurationEl, timingNoteEl;
  let routeDetailsToggle, routeDetailsBox, routeDetailsBody;

  // ---------- Отрисовка ДЕТАЛЕЙ маршрута ----------
  function renderRouteDetails(best, todayShifted, nowAbs) {
    routeDetailsBody.innerHTML = '';
    if (!best || !best.segments || best.segments.length === 0) {
      routeDetailsBox.classList.remove('open');
      return;
    }

    // Группируем сегменты по «поездкам» — при смене линии начинается новая группа
    const groups = [];
    for (const seg of best.segments) {
      if (groups.length === 0) {
        groups.push({
          line: seg.line, from: seg.from, to: seg.to,
          boardingTime: seg.boardingTime, arrivalTime: seg.arrivalTime,
          arrivalAtFromAbs: seg.arrivalAtFromAbs
        });
      } else {
        const last = groups[groups.length - 1];
        if (seg.line === last.line) {
          last.to = seg.to;
          last.arrivalTime = seg.arrivalTime;
        } else {
          groups.push({
            line: seg.line, from: seg.from, to: seg.to,
            boardingTime: seg.boardingTime, arrivalTime: seg.arrivalTime,
            arrivalAtFromAbs: null
          });
        }
      }
    }

    const stops = [];
    const firstGroup = groups[0];
    stops.push({
      kind: 'start',
      stationId: firstGroup.from,
      line: firstGroup.line,
      arriveTime: firstGroup.arrivalAtFromAbs,
      departTime: firstGroup.boardingTime,
      stayMinutes: firstGroup.arrivalAtFromAbs != null ? (firstGroup.boardingTime - firstGroup.arrivalAtFromAbs) : null
    });

    for (let i = 1; i < groups.length; i++) {
      const prevGroup = groups[i - 1], curGroup = groups[i];
      stops.push({
        kind: 'transfer',
        stationId: curGroup.from,
        prevLine: prevGroup.line,
        nextLine: curGroup.line,
        arriveTime: prevGroup.arrivalTime,
        departTime: curGroup.boardingTime,
        stayMinutes: curGroup.boardingTime - prevGroup.arrivalTime
      });
    }

    const lastGroup = groups[groups.length - 1];
    stops.push({
      kind: 'end',
      stationId: lastGroup.to,
      line: lastGroup.line,
      arriveTime: lastGroup.arrivalTime,
      departTime: null,
      stayMinutes: null
    });

    stops.forEach((stop) => {
      const station = M.stationsData.find(s => s.id === stop.stationId);
      const el = document.createElement('div');
      el.className = 'detail-stop';
      if (stop.kind === 'start') el.classList.add('kind-start');
      if (stop.kind === 'end') el.classList.add('kind-end');
      if (stop.kind === 'transfer') el.classList.add('kind-transfer');
      if (stop.kind === 'start') el.classList.add('seg-' + stop.line);
      else if (stop.kind === 'transfer') el.classList.add('seg-' + stop.nextLine);

      const dot = document.createElement('div');
      dot.className = 'detail-dot';
      if (stop.kind === 'transfer') {
        dot.style.setProperty('--top-color', M.LINE_COLORS[stop.prevLine]);
        dot.style.setProperty('--bottom-color', M.LINE_COLORS[stop.nextLine]);
      } else if (stop.kind === 'start' || stop.kind === 'end') {
        dot.style.setProperty('--dot-color', M.LINE_COLORS[stop.line]);
      }
      el.appendChild(dot);

      const content = document.createElement('div');
      content.className = 'detail-content';

      const name = document.createElement('div');
      name.className = 'detail-station-name';
      name.textContent = station ? station.name : stop.stationId;
      content.appendChild(name);

      const action = document.createElement('div');
      action.className = 'detail-action';
      if (stop.kind === 'start') {
        action.innerHTML = 'Садимся на <span class="line-dot-inline" style="background:' +
          M.LINE_COLORS[stop.line] + '"></span>' + M.LINE_NAMES[stop.line].accusative + ' ветку';
      } else if (stop.kind === 'end') {
        action.textContent = 'Выходим';
      } else {
        action.innerHTML = 'Пересадка с <span class="line-dot-inline" style="background:' +
          M.LINE_COLORS[stop.prevLine] + '"></span>' + M.LINE_NAMES[stop.prevLine].genitive +
          ' на <span class="line-dot-inline" style="background:' +
          M.LINE_COLORS[stop.nextLine] + '"></span>' + M.LINE_NAMES[stop.nextLine].accusative;
      }
      content.appendChild(action);

      const timings = document.createElement('div');
      timings.className = 'detail-timings';

      if (stop.arriveTime != null) {
        const f = M.formatAbsTimeWithDay(stop.arriveTime, todayShifted);
        const badge = f.isToday ? '' : `<span class="day-badge">${f.dayShort}</span>`;
        let arrivedBadge = '';
        if (stop.kind === 'start' && nowAbs != null && stop.arriveTime <= nowAbs) {
          const diff = nowAbs - stop.arriveTime;
          if (diff <= 30) arrivedBadge = '<span class="arrived-badge">уже на станции</span>';
        }
        const row = document.createElement('div');
        row.className = 'detail-timing-row';
        row.innerHTML = `<span class="tt-label">${stop.kind === 'end' ? 'Прибытие' : 'Прибытие поезда'}</span>` +
          `<span class="tt-value">${badge}${f.time}${arrivedBadge}</span>`;
        timings.appendChild(row);
      }

      if (stop.departTime != null) {
        const f = M.formatAbsTimeWithDay(stop.departTime, todayShifted);
        const badge = f.isToday ? '' : `<span class="day-badge">${f.dayShort}</span>`;
        const row = document.createElement('div');
        row.className = 'detail-timing-row';
        row.innerHTML = `<span class="tt-label">Отправление</span>` +
          `<span class="tt-value">${badge}${f.time}</span>`;
        timings.appendChild(row);
      }

      if (stop.stayMinutes != null && stop.stayMinutes > 0) {
        const stay = document.createElement('div');
        stay.className = 'detail-stay' + (stop.kind === 'transfer' ? ' wait' : '');
        stay.textContent = (stop.kind === 'transfer' ? 'Ожидание на станции: ' : 'Стоянка: ') +
          M.formatDuration(stop.stayMinutes);
        timings.appendChild(stay);
      }

      content.appendChild(timings);
      el.appendChild(content);
      routeDetailsBody.appendChild(el);
    });
  }

  // ---------- Отрисовка сводки времени ----------
  function renderRouteTiming(best, nowAbs, todayShifted) {
    if (!best || best.noPath || best.noConnection) {
      departureTimeEl.textContent = '—';
      arrivalTimeEl.textContent = '—';
      waitDurationEl.innerHTML = '<span class="duration-label">До отправления</span>—';
      routeDurationEl.innerHTML = '<span class="duration-label">В пути</span>—';
      if (best && best.noPath) timingNoteEl.textContent = 'Между этими станциями нет физического пути в схеме.';
      else if (best && best.noConnection) timingNoteEl.textContent = 'Нет стыковки рейсов в ближайшие 30 дней.';
      else timingNoteEl.textContent = 'Не удалось построить маршрут по этому направлению.';
      timingNoteEl.className = 'timing-note warn';
      routeDetailsBox.classList.remove('open');
      routeDetailsBody.innerHTML = '';
      return;
    }

    const dep = M.formatAbsTimeWithDay(best.departAbs, todayShifted);
    const arr = M.formatAbsTimeWithDay(best.arriveAbs, todayShifted);
    const duration = best.arriveAbs - best.departAbs;
    const wait = Math.max(0, best.departAbs - nowAbs);

    if (dep.isToday) departureTimeEl.innerHTML = dep.time;
    else departureTimeEl.innerHTML = `<span class="day-badge">${dep.dayShort}</span>${dep.time}`;
    if (arr.isToday) arrivalTimeEl.innerHTML = arr.time;
    else arrivalTimeEl.innerHTML = `<span class="day-badge">${arr.dayShort}</span>${arr.time}`;

    waitDurationEl.innerHTML = `<span class="duration-label">До отправления</span>${M.formatDuration(wait)}`;
    routeDurationEl.innerHTML = `<span class="duration-label">В пути</span>${M.formatDuration(duration)}`;

    let numTransfers = 0;
    for (let i = 0; i < best.segments.length - 1; i++) {
      if (best.segments[i].line !== best.segments[i + 1].line) numTransfers++;
    }
    const noteParts = [];
    if (numTransfers > 0) noteParts.push(`Пересадок: ${numTransfers}`);
    else noteParts.push('Без пересадок');
    if (!dep.isToday) noteParts.push(`Отправление в ${dep.dayFull.toLowerCase()}`);
    if (!arr.isToday && arr.dayShort !== dep.dayShort) {
      noteParts.push(`Прибытие в ${arr.dayFull.toLowerCase()}`);
    }
    timingNoteEl.textContent = noteParts.join(' • ');
    timingNoteEl.className = 'timing-note';

    renderRouteDetails(best, todayShifted, nowAbs);
  }

  // ---------- Публичное API ----------
  M.routeDetails = {
    init: function () {
      routeTiming = document.getElementById('routeTiming');
      departureTimeEl = document.getElementById('departureTime');
      arrivalTimeEl = document.getElementById('arrivalTime');
      waitDurationEl = document.getElementById('waitDuration');
      routeDurationEl = document.getElementById('routeDuration');
      timingNoteEl = document.getElementById('timingNote');
      routeDetailsToggle = document.getElementById('routeDetailsToggle');
      routeDetailsBox = document.getElementById('routeDetails');
      routeDetailsBody = document.getElementById('routeDetailsBody');

      routeDetailsToggle.addEventListener('click', () => {
        routeDetailsBox.classList.toggle('open');
        if (window.innerWidth <= 700 && routeDetailsBox.classList.contains('open')) {
          if (M.mobilePanel && M.mobilePanel.setState) M.mobilePanel.setState('expanded');
        }
      });
    },

    hide: function () {
      routeTiming.classList.remove('visible');
      routeDetailsBox.classList.remove('open');
      routeDetailsBody.innerHTML = '';
    },

    show: function (best, nowAbs, todayShifted) {
      routeTiming.classList.add('visible');
      renderRouteTiming(best, nowAbs, todayShifted);
    }
  };

})(window.CatWarMetro = window.CatWarMetro || {});