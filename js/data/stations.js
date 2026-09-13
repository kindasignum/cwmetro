/* =========================================================
   ДАННЫЕ О СТАНЦИЯХ, ЛИНИЯХ И ИХ ОБОЗНАЧЕНИЯХ
   ========================================================= */

window.CatWarMetro = window.CatWarMetro || {};

// Координаты станций. Если станция принадлежит нескольким линиям,
// у неё есть lineCoords — позиции по каждой линии отдельно.
// Основные x, y — используются как fallback.
window.CatWarMetro.stationsData = [
  { id: 'gorod',              name: 'Город',                x: 180,  y: 220, lines: ['purple'] },
  { id: 'gory',               name: 'Горы',                 x: 400,  y: 220, lines: ['purple'] },
  { id: 'poselok',            name: 'Посёлок',              x: 620,  y: 400, lines: ['purple'] },
  { id: 'predpustynye_ozero', name: 'Предпустынье (озеро)', x: 780,  y: 400, lines: ['purple', 'green'],
    lineCoords: {
      purple: { x: 780, y: 400 },
      green:  { x: 780, y: 400 }
    }
  },
  { id: 'predpustynye_more',  name: 'Предпустынье (море)',  x: 1420, y: 646, lines: ['orange', 'blue'],
    lineCoords: {
      blue:   { x: 1400, y: 620 },
      orange: { x: 1440, y: 672 }
    }
  },
  { id: 'derevnya',           name: 'Деревня',              x: 1220, y: 646, lines: ['orange', 'blue', 'pink'],
    lineCoords: {
      blue:   { x: 1200, y: 620 },
      orange: { x: 1240, y: 672 },
      pink:   { x: 1200, y: 606 }
    }
  },
  { id: 'ruiny',              name: 'Руины',                x: 1130, y: 800, lines: ['orange'] },
  { id: 'oazis',              name: 'Оазис',                x: 900,  y: 520, lines: ['green'] },
  { id: 'centr_labirinta',    name: 'Центр лабиринта',      x: 1020, y: 620, lines: ['green', 'blue', 'pink', 'yellow'],
    lineCoords: {
      green:  { x: 1020, y: 620 },
      blue:   { x: 1020, y: 620 },
      pink:   { x: 1020, y: 606 },
      yellow: { x: 1020, y: 620 }
    }
  },
  { id: 'gornaya_dolina',     name: 'Горная долина',        x: 1180, y: 380, lines: ['yellow'] }
];

window.CatWarMetro.LINE_COLORS = {
  purple: '#8e44ad',
  orange: '#e67e22',
  green:  '#27ae60',
  blue:   '#2980b9',
  pink:   '#e91e8c',
  yellow: '#d4a800'
};

window.CatWarMetro.LINE_NAMES = {
  purple: { accusative: 'Горную',       genitive: 'Горной' },
  orange: { accusative: 'Руинную',      genitive: 'Руинной' },
  green:  { accusative: 'Озёрную',      genitive: 'Озёрной' },
  blue:   { accusative: 'Морскую',      genitive: 'Морской' },
  pink:   { accusative: 'Деревенскую',  genitive: 'Деревенской' },
  yellow: { accusative: 'Долинную',     genitive: 'Долинной' }
};

window.CatWarMetro.lines = {
  purple: ['gorod', 'gory', 'poselok', 'predpustynye_ozero'],
  orange: ['predpustynye_more', 'derevnya', 'ruiny'],
  green:  ['predpustynye_ozero', 'oazis', 'centr_labirinta'],
  blue:   ['centr_labirinta', 'derevnya', 'predpustynye_more'],
  pink:   ['derevnya', 'centr_labirinta'],
  yellow: ['centr_labirinta', 'gornaya_dolina']
};

// Окна депо — время, когда поезд на линии отсутствует.
// Формат: { start: минуты от начала суток, end: минуты от начала суток }
// Если end < start — окно переходит через полночь.
window.CatWarMetro.DEPOT_HOURS = {
  purple: { start: 0,    end: 360 },  // 00:00 – 06:00
  orange: { start: 120,  end: 360 }   // 02:00 – 06:00
};