/* =========================================================
   РАСПИСАНИЯ ВСЕХ ВЕТОК
   ========================================================= */

(function (M) {

  const hhmm = M.hhmmToMinutes;
  const dateToAbsDayIndex = M.dateToAbsDayIndex;

  // -------------------- ФИОЛЕТОВАЯ (Горная) --------------------
  // Поезд прибывает на начальную станцию заранее и стоит до отправления:
  //   Город: приб. 06:00, отпр. 08:00; приб. 14:00, отпр. 16:00
  //   Озеро: приб. 10:00, отпр. 12:00; приб. 18:00, отпр. 20:00
  const purpleTrips = [
    { line: 'purple', days: null, stops: [
      { station: 'gorod', arrive: hhmm('06:00'), depart: hhmm('08:00') },
      { station: 'gory', arrive: hhmm('08:45'), depart: hhmm('09:15') },
      { station: 'poselok', arrive: hhmm('10:00'), depart: hhmm('10:15') },
      { station: 'predpustynye_ozero', arrive: hhmm('11:00'), depart: null } ]},
    { line: 'purple', days: null, stops: [
      { station: 'gorod', arrive: hhmm('14:00'), depart: hhmm('16:00') },
      { station: 'gory', arrive: hhmm('16:45'), depart: hhmm('17:15') },
      { station: 'poselok', arrive: hhmm('18:00'), depart: hhmm('18:15') },
      { station: 'predpustynye_ozero', arrive: hhmm('19:00'), depart: null } ]},
    { line: 'purple', days: null, stops: [
      { station: 'predpustynye_ozero', arrive: hhmm('10:00'), depart: hhmm('12:00') },
      { station: 'poselok', arrive: hhmm('12:45'), depart: hhmm('13:00') },
      { station: 'gory', arrive: hhmm('13:45'), depart: hhmm('14:15') },
      { station: 'gorod', arrive: hhmm('15:00'), depart: null } ]},
    { line: 'purple', days: null, stops: [
      { station: 'predpustynye_ozero', arrive: hhmm('18:00'), depart: hhmm('20:00') },
      { station: 'poselok', arrive: hhmm('20:45'), depart: hhmm('21:00') },
      { station: 'gory', arrive: hhmm('21:45'), depart: hhmm('22:15') },
      { station: 'gorod', arrive: hhmm('23:00'), depart: null } ]}
  ];

  // -------------------- ОРАНЖЕВАЯ (Руинная) --------------------
  // Поезд прибывает на начальную станцию заранее:
  //   Море: приб. 06:00, отпр. 08:00; приб. 15:00, отпр. 17:00
  //   Руины: приб. 10:10, отпр. 12:10; приб. 19:10, отпр. 21:10
  const orangeTrips = [
    { line: 'orange', days: null, stops: [
      { station: 'predpustynye_more', arrive: hhmm('06:00'), depart: hhmm('08:00') },
      { station: 'derevnya', arrive: hhmm('10:00'), depart: hhmm('11:00') },
      { station: 'ruiny', arrive: hhmm('12:00'), depart: null } ]},
    { line: 'orange', days: null, stops: [
      { station: 'predpustynye_more', arrive: hhmm('15:00'), depart: hhmm('17:00') },
      { station: 'derevnya', arrive: hhmm('19:00'), depart: hhmm('20:00') },
      { station: 'ruiny', arrive: hhmm('21:00'), depart: null } ]},
    { line: 'orange', days: null, stops: [
      { station: 'ruiny', arrive: hhmm('10:10'), depart: hhmm('12:10') },
      { station: 'derevnya', arrive: hhmm('13:10'), depart: hhmm('14:10') },
      { station: 'predpustynye_more', arrive: hhmm('16:10'), depart: null } ]},
    { line: 'orange', days: null, stops: [
      { station: 'ruiny', arrive: hhmm('19:10'), depart: hhmm('21:10') },
      { station: 'derevnya', arrive: hhmm('22:10'), depart: hhmm('23:10') },
      { station: 'predpustynye_more', arrive: hhmm('01:10') + 1440, depart: null } ]}
  ];

  // -------------------- ЗЕЛЁНАЯ (Озёрная) --------------------
  // Рейсы по конкретным дням недели. Поезд приходит на начальную станцию
  // в момент отправления (arrive == depart).
  const greenTrips = [
    { line: 'green', days: [0, 2, 4], stops: [
      { station: 'predpustynye_ozero', arrive: hhmm('06:00'), depart: hhmm('06:00') },
      { station: 'oazis', arrive: hhmm('08:00'), depart: hhmm('09:00') },
      { station: 'centr_labirinta', arrive: hhmm('18:00'), depart: null } ]},
    { line: 'green', days: [1, 3, 5], stops: [
      { station: 'centr_labirinta', arrive: hhmm('03:30'), depart: hhmm('03:30') },
      { station: 'oazis', arrive: hhmm('12:30'), depart: hhmm('13:30') },
      { station: 'predpustynye_ozero', arrive: hhmm('15:30'), depart: null } ]}
  ];

  // -------------------- СИНЯЯ (Морская) --------------------
  const blueTrips = [
    { line: 'blue', days: [0, 2, 4], stops: [
      { station: 'predpustynye_more', arrive: hhmm('06:00'), depart: hhmm('06:00') },
      { station: 'derevnya', arrive: hhmm('08:00'), depart: hhmm('09:00') },
      { station: 'centr_labirinta', arrive: hhmm('18:00'), depart: null } ]},
    { line: 'blue', days: [1, 3, 5], stops: [
      { station: 'centr_labirinta', arrive: hhmm('03:30'), depart: hhmm('03:30') },
      { station: 'derevnya', arrive: hhmm('12:30'), depart: hhmm('13:30') },
      { station: 'predpustynye_more', arrive: hhmm('15:30'), depart: null } ]}
  ];

  // -------------------- РОЗОВАЯ (Деревенская, временная) --------------------
  const pinkTrips = [
    { line: 'pink', absDays: ['2026-09-11', '2026-09-13', '2026-09-15'].map(dateToAbsDayIndex), stops: [
      { station: 'derevnya', arrive: null, depart: hhmm('21:00') },
      { station: 'centr_labirinta', arrive: hhmm('05:00') + 1440, depart: null } ]},
    { line: 'pink', absDays: ['2026-09-12', '2026-09-14'].map(dateToAbsDayIndex), stops: [
      { station: 'centr_labirinta', arrive: null, depart: hhmm('21:00') },
      { station: 'derevnya', arrive: hhmm('05:00') + 1440, depart: null } ]}
  ];

  // -------------------- ЖЁЛТАЯ (Долинная, временная) --------------------
  // Один непрерывный рейс на все дни работы. Поезд ходит по циклу
  // Центр → Долина → Центр → Долина...
  // Начало: 13 сентября 19:20 (приб. в Центр), отпр. 19:40.
  // Конец: 18 сентября 00:40 (приб. в Центр, без отправления).
  //
  // Записываем единый рейс, все времена — минуты от начала 13 сентября 00:00
  // (могут превышать 1440 — это дни после 13-го).
  const yellowTrip = (() => {
    const startDay = dateToAbsDayIndex('2026-09-13');
    const endDay = dateToAbsDayIndex('2026-09-18');
    const totalDays = endDay - startDay;

    const stops = [];
    // Первая стоянка в Центре: приб. 19:20, отпр. 19:40
    let t = hhmm('19:20');
    stops.push({ station: 'centr_labirinta', arrive: t, depart: t + 20 });
    t += 20;
    // t = 19:40 — выехали из Центра

    // Последняя точка — прибытие в Центр 18 сентября 00:40 = totalDays*1440 + 40
    const lastAbs = totalDays * 1440 + hhmm('00:40');

    // Цикл: Центр → Долина (60 мин) → стоянка 20 → Долина → Центр (60 мин) → стоянка 20 → ...
    while (true) {
      const arriveDolina = t + 60;
      if (arriveDolina > lastAbs) break;
      stops.push({ station: 'gornaya_dolina', arrive: arriveDolina, depart: arriveDolina + 20 });
      t = arriveDolina + 20;

      const arriveCentr = t + 60;
      if (arriveCentr > lastAbs) break;
      // Если это последнее прибытие в Центр (без отправления) — depart: null
      const isLast = arriveCentr >= lastAbs - 1;
      stops.push({ station: 'centr_labirinta', arrive: arriveCentr, depart: isLast ? null : arriveCentr + 20 });
      t = arriveCentr + 20;
    }

    return {
      line: 'yellow',
      absDays: [startDay],
      stops: stops
    };
  })();

  const yellowTrips = [yellowTrip];

  // -------------------- ЭКСПОРТ --------------------
  M.allTrips = [
    ...purpleTrips, ...orangeTrips, ...greenTrips,
    ...blueTrips, ...pinkTrips, ...yellowTrips
  ];

  M.tripsByLine = {
    purpleTrips, orangeTrips, greenTrips, blueTrips, pinkTrips, yellowTrips
  };

})(window.CatWarMetro = window.CatWarMetro || {});