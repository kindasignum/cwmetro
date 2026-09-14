/* =========================================================
   ПОИСК МАРШРУТА И СИМУЛЯЦИЯ ПОЕЗДКИ
   ========================================================= */

(function (M) {

  // Проверяет, работает ли рейс в заданный абсолютный день.
  // Используется только для рейсов с days (регулярные дни недели).
  M.tripWorksOnDay = function (trip, candAbsDayIndex) {
    if (trip.absDays) return trip.absDays.includes(candAbsDayIndex);
    if (trip.days) {
      const candShiftedDay = ((candAbsDayIndex % 7) + 7 + 3) % 7;
      return trip.days.includes(candShiftedDay);
    }
    return true;
  };

  // Проверяет, является ли рейс "длинным" (несколько дней одной базой).
  // Признак: absDays содержит ровно одну дату, и последняя остановка имеет
  // время больше суток (переход через полночь несколько раз).
  function isLongTrip(trip) {
    if (!trip.absDays || trip.absDays.length !== 1) return false;
    // Длинный рейс — если есть остановки с временем > 1440
    return trip.stops.some(s =>
      (s.arrive != null && s.arrive > 1440) ||
      (s.depart != null && s.depart > 1440)
    );
  }

  // Ищет последнее прибытие поезда указанной линии на станцию,
  // которое произошло НЕ ПОЗЖЕ beforeAbsTime.
  M.findArrivalBeforeStation = function (stationId, lineName, beforeAbsTime) {
    const aroundDay = Math.floor(beforeAbsTime / 1440);
    let best = null;

    for (const trip of M.allTrips) {
      if (trip.line !== lineName) continue;

      // Собираем все индексы станции в stops
      const indices = [];
      for (let i = 0; i < trip.stops.length; i++) {
        if (trip.stops[i].station === stationId) indices.push(i);
      }
      if (indices.length === 0) continue;

      if (isLongTrip(trip)) {
        // Длинный рейс (жёлтая): одна базовая дата, все времена от неё
        const baseDayStart = trip.absDays[0] * 1440;
        for (const idx of indices) {
          const s = trip.stops[idx];
          if (s.arrive == null) continue;
          if (s.depart != null && s.arrive === s.depart) continue;
          const candAbs = baseDayStart + s.arrive;
          if (candAbs > beforeAbsTime) continue;
          if (!best || candAbs > best) best = candAbs;
        }
        continue;
      }

      if (trip.absDays && trip.absDays.length > 0) {
        // Рейс с конкретными датами (розовая): перебираем все даты в absDays
        for (const dayIdx of trip.absDays) {
          for (const idx of indices) {
            const s = trip.stops[idx];
            if (s.arrive == null) continue;
            if (s.depart != null && s.arrive === s.depart) continue;
            const candAbs = dayIdx * 1440 + s.arrive;
            if (candAbs > beforeAbsTime) continue;
            if (!best || candAbs > best) best = candAbs;
          }
        }
        continue;
      }

      // Обычный режим (по дням недели)
      for (const idx of indices) {
        const s = trip.stops[idx];
        if (s.arrive == null) continue;
        if (s.depart != null && s.arrive === s.depart) continue;
        for (let off = -10; off <= 0; off++) {
          const candDay = aroundDay + off;
          if (!M.tripWorksOnDay(trip, candDay)) continue;
          const candAbs = candDay * 1440 + s.arrive;
          if (candAbs > beforeAbsTime) continue;
          if (!best || candAbs > best) best = candAbs;
        }
      }
    }

    return best;
  };

  // Ищет ближайший рейс указанной линии, который отправляется с startStation
  // после afterAbsoluteMinutes и доезжает до endStation.
  M.findTrip = function (lineName, startStation, endStation, afterAbsoluteMinutes) {
    let best = null;

    for (const trip of M.allTrips) {
      if (trip.line !== lineName) continue;

      // Собираем все индексы станций (для длинных рейсов их может быть много)
      const startIndices = [];
      const endIndices = [];
      for (let i = 0; i < trip.stops.length; i++) {
        if (trip.stops[i].station === startStation) startIndices.push(i);
        if (trip.stops[i].station === endStation) endIndices.push(i);
      }
      if (startIndices.length === 0 || endIndices.length === 0) continue;

      for (const startIdx of startIndices) {
        for (const endIdx of endIndices) {
          if (endIdx <= startIdx) continue;

          const startStop = trip.stops[startIdx];
          const endStop = trip.stops[endIdx];
          if (startStop.depart == null || endStop.arrive == null) continue;

          // Длительность поездки
          let travelTime = 0;
          for (let i = startIdx; i < endIdx; i++) {
            const cur = trip.stops[i];
            const nxt = trip.stops[i + 1];
            let delta = cur.depart == null ? 0 : (nxt.arrive - cur.depart);
            if (delta < 0) delta += 1440;
            travelTime += delta;
            if (i + 1 < endIdx && nxt.depart != null) {
              let wait = nxt.depart - nxt.arrive;
              if (wait < 0) wait += 1440;
              travelTime += wait;
            }
          }

          // Разбираем режим рейса
          if (isLongTrip(trip)) {
            // Длинный рейс — одна база
            const baseDayStart = trip.absDays[0] * 1440;
            const candDepartAbs = baseDayStart + startStop.depart;
            const candArriveAbs = candDepartAbs + travelTime;
            if (candDepartAbs < afterAbsoluteMinutes - 0.001) continue;
            if (!best || candDepartAbs < best.boardingTime) {
              best = { boardingTime: candDepartAbs, arrivalTime: candArriveAbs, trip, startIdx, endIdx };
            }
            continue;
          }

          if (trip.absDays && trip.absDays.length > 0) {
            // Рейс с конкретными датами (розовая) — перебираем все absDays
            for (const dayIdx of trip.absDays) {
              const candDepartAbs = dayIdx * 1440 + startStop.depart;
              if (candDepartAbs < afterAbsoluteMinutes - 0.001) continue;
              const candArriveAbs = candDepartAbs + travelTime;
              if (!best || candDepartAbs < best.boardingTime) {
                best = { boardingTime: candDepartAbs, arrivalTime: candArriveAbs, trip, startIdx, endIdx };
              }
            }
            continue;
          }

          // Обычный режим (по дням недели)
          const startDepartMin = startStop.depart;
          const currentAbsDayIndex = Math.floor(afterAbsoluteMinutes / 1440);

          for (let dayOffset = 0; dayOffset <= 30; dayOffset++) {
            const candAbsDayIndex = currentAbsDayIndex + dayOffset;
            if (!M.tripWorksOnDay(trip, candAbsDayIndex)) continue;

            const candDepartAbs = candAbsDayIndex * 1440 + startDepartMin;
            if (candDepartAbs < afterAbsoluteMinutes - 0.001) continue;

            const candArriveAbs = candDepartAbs + travelTime;

            if (!best || candDepartAbs < best.boardingTime) {
              best = { boardingTime: candDepartAbs, arrivalTime: candArriveAbs, trip, startIdx, endIdx };
            }
            break;
          }
        }
      }
    }

    return best;
  };

  M.simulateTrip = function (steps, nowAbs) {
    if (!steps || steps.length === 0) return null;

    let currentAbs = nowAbs;
    const segments = [];

    for (let stepIdx = 0; stepIdx < steps.length; stepIdx++) {
      const step = steps[stepIdx];
      const tripInfo = M.findTrip(step.line, step.from, step.to, currentAbs);
      if (!tripInfo) return null;

      let arrivalAtFromAbs;
      if (stepIdx === 0) {
        arrivalAtFromAbs = M.findArrivalBeforeStation(step.from, step.line, tripInfo.boardingTime);
        if (arrivalAtFromAbs == null) arrivalAtFromAbs = tripInfo.boardingTime;
        if (arrivalAtFromAbs > tripInfo.boardingTime) arrivalAtFromAbs = tripInfo.boardingTime;
      } else {
        arrivalAtFromAbs = segments[segments.length - 1].arrivalTime;
      }

      segments.push({
        line: step.line,
        from: step.from,
        to: step.to,
        boardingTime: tripInfo.boardingTime,
        arrivalTime: tripInfo.arrivalTime,
        arrivalAtFromAbs: arrivalAtFromAbs
      });

      currentAbs = tripInfo.arrivalTime;
    }

    const stationPath = [steps[0].from];
    for (const step of steps) stationPath.push(step.to);

    return {
      path: stationPath,
      steps: steps,
      departAbs: segments[0].boardingTime,
      arriveAbs: segments[segments.length - 1].arrivalTime,
      segments
    };
  };

  M.findBestRoute = function (startId, endId, nowAbs) {
    const allPaths = M.findAllPaths(startId, endId);
    if (allPaths.length === 0) return { noPath: true };

    let best = null;
    let bestTransfers = Infinity;

    for (const steps of allPaths) {
      const result = M.simulateTrip(steps, nowAbs);
      if (!result) continue;

      let transfers = 0;
      for (let i = 0; i < result.segments.length - 1; i++) {
        if (result.segments[i].line !== result.segments[i + 1].line) transfers++;
      }

      if (transfers < bestTransfers ||
          (transfers === bestTransfers && (!best || result.arriveAbs < best.arriveAbs))) {
        best = result;
        bestTransfers = transfers;
      }
    }

    if (!best) return { noConnection: true };
    return best;
  };

})(window.CatWarMetro = window.CatWarMetro || {});
