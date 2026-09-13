/* =========================================================
   ПОДСВЕТКА МАРШРУТА НА СХЕМЕ
   ========================================================= */

(function (M) {

  let svgEl, bubbleLayer;
  let currentActiveLines = new Set();

  function createBubble(x, y, label, offsetY) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'route-bubble visible');

    const bubbleW = Math.max(64, label.length * 9 + 20);
    const bubbleH = 26;
    const bubbleX = x - bubbleW / 2;
    const bubbleY = y + offsetY;
    const tipHeight = 8, tipWidth = 12;
    const tipTopY = y + offsetY - tipHeight;

    const tip = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    tip.setAttribute('points',
      `${x - tipWidth/2},${bubbleY + 1} ${x + tipWidth/2},${bubbleY + 1} ${x},${tipTopY}`);
    tip.setAttribute('class', 'bubble-body');
    g.appendChild(tip);

    const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    body.setAttribute('x', bubbleX);
    body.setAttribute('y', bubbleY);
    body.setAttribute('width', bubbleW);
    body.setAttribute('height', bubbleH);
    body.setAttribute('rx', 8);
    body.setAttribute('ry', 8);
    body.setAttribute('class', 'bubble-body');
    g.appendChild(body);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', bubbleY + bubbleH / 2 + 1);
    text.setAttribute('class', 'bubble-text');
    text.textContent = label;
    g.appendChild(text);

    return g;
  }

  M.routeHighlight = {
    init: function () {
      svgEl = document.getElementById('metroSvg');
      bubbleLayer = document.getElementById('bubbleLayer');
    },

    clear: function () {
      if (svgEl) svgEl.classList.remove('route-active');
      document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
      if (bubbleLayer) bubbleLayer.innerHTML = '';
      currentActiveLines = new Set();
    },

    apply: function (pathOrSteps) {
      this.clear();
      if (!pathOrSteps || pathOrSteps.length === 0) return;

      let stationPath = [], steps = null;
      if (typeof pathOrSteps[0] === 'string') {
        stationPath = [...pathOrSteps];
      } else {
        steps = pathOrSteps;
        stationPath = [steps[0].from];
        for (const step of steps) stationPath.push(step.to);
      }

      if (stationPath.length < 2) return;
      svgEl.classList.add('route-active');

      // Собираем активные линии
      if (steps) {
        for (const step of steps) currentActiveLines.add(step.line);
      }

      stationPath.forEach(id => {
        const el = document.querySelector(`.station[data-id="${id}"]`);
        if (el) el.classList.add('active');
      });

      for (let i = 0; i < stationPath.length - 1; i++) {
        const a = stationPath[i], b = stationPath[i + 1];
        let seg = null;
        if (steps) {
          const step = steps[i];
          if (step) {
            seg = document.querySelector(
              `.line-segment[data-from="${step.from}"][data-to="${step.to}"][data-line="${step.line}"], ` +
              `.line-segment[data-from="${step.to}"][data-to="${step.from}"][data-line="${step.line}"]`);
          }
        }
        if (!seg) {
          seg = document.querySelector(
            `.line-segment[data-from="${a}"][data-to="${b}"], ` +
            `.line-segment[data-from="${b}"][data-to="${a}"]`);
        }
        if (seg) seg.classList.add('active');
      }

      const transferMap = {
        'predpustynye_more': 'transfer-more',
        'derevnya': 'transfer-derevnya'
      };
      stationPath.forEach((id, idx) => {
        const st = M.stationsData.find(s => s.id === id);
        if (!st || st.lines.length < 2) return;
        const prevId = idx > 0 ? stationPath[idx - 1] : null;
        const nextId = idx < stationPath.length - 1 ? stationPath[idx + 1] : null;
        const prev = prevId ? M.stationsData.find(s => s.id === prevId) : null;
        const next = nextId ? M.stationsData.find(s => s.id === nextId) : null;
        const prevLine = prev ? prev.lines.find(l => st.lines.includes(l)) : null;
        const nextLine = next ? next.lines.find(l => st.lines.includes(l)) : null;
        if (prevLine && nextLine && prevLine !== nextLine) {
          const trId = transferMap[id];
          if (trId) {
            const tr = document.getElementById(trId);
            if (tr) tr.classList.add('active');
          }
        }
      });

      const startSt = M.stationsData.find(s => s.id === stationPath[0]);
      const endSt = M.stationsData.find(s => s.id === stationPath[stationPath.length - 1]);
      if (startSt) bubbleLayer.appendChild(
        createBubble(startSt.x, startSt.y, 'Отсюда', (startSt.lines.length > 1) ? 28 : 26));
      if (endSt) bubbleLayer.appendChild(
        createBubble(endSt.x, endSt.y, 'Сюда', (endSt.lines.length > 1) ? 28 : 26));
    },

    // Возвращает Set имён активных линий (для live-trains)
    getActiveLines: function () {
      return currentActiveLines;
    }
  };

})(window.CatWarMetro = window.CatWarMetro || {});