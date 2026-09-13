/* =========================================================
   УТИЛИТЫ ВРЕМЕНИ: преобразования, форматирование
   ========================================================= */

(function (M) {

  M.hhmmToMinutes = function (hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  M.dateToAbsDayIndex = function (dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  };

  M.DAY_NAMES_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  M.DAY_NAMES_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Формат абсолютных минут (от 1970-01-01 московского времени) в {time, dayShort, dayFull, isToday}
  M.formatAbsTimeWithDay = function (absMinutes, todayShiftedDay) {
    const absDay = Math.floor(absMinutes / 1440);
    const minutesInDay = ((absMinutes % 1440) + 1440) % 1440;
    const h = Math.floor(minutesInDay / 60);
    const m = Math.round(minutesInDay % 60);
    const timeStr = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    const shiftedDay = ((absDay % 7) + 7 + 3) % 7;
    return {
      time: timeStr,
      dayShort: M.DAY_NAMES_SHORT[shiftedDay],
      dayFull: M.DAY_NAMES_FULL[shiftedDay],
      isToday: shiftedDay === todayShiftedDay
    };
  };

  M.formatDuration = function (mins) {
    mins = Math.max(0, Math.round(mins));
    if (mins < 1) return 'меньше минуты';
    if (mins < 60) return mins + ' мин';
    const h = Math.floor(mins / 60), m = mins % 60;
    if (m === 0) return h + ' ч';
    return h + ' ч ' + m + ' мин';
  };

  // Возвращает текущее московское время в разных форматах:
  //   shiftedDay 0=Пн..6=Вс
  //   absoluteMinutes — минуты от 1970-01-01 (московский календарь)
  M.getMoscowNow = function () {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      year: 'numeric', month: '2-digit', day: '2-digit',
      weekday: 'short',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }).formatToParts(now);
    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });

    const year = parseInt(map.year, 10);
    const month = parseInt(map.month, 10);
    const day = parseInt(map.day, 10);
    const h = parseInt(map.hour, 10);
    const m = parseInt(map.minute, 10);
    const s = parseInt(map.second, 10);

    const absDayIndex = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
    const minutesFromMidnight = h * 60 + m + s / 60;
    const absoluteMinutes = absDayIndex * 1440 + minutesFromMidnight;
    const shiftedDay = ((absDayIndex % 7) + 7 + 3) % 7;

    return {
      shiftedDay,
      minutesFromMidnight,
      absoluteMinutes,
      absDayIndex,
      year, month, day,
      rawDate: now
    };
  };

})(window.CatWarMetro = window.CatWarMetro || {});