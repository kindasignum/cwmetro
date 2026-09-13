/* =========================================================
   ПАН, ЗУМ, ПИНЧ — управление схемой
   ========================================================= */

(function (M) {

  let viewport, mapContent;
  let scale = 1, translateX = 0, translateY = 0;

  let isDragging = false, startX, startY, startTranslateX, startTranslateY;
  let pinchStartDist = 0, pinchStartScale = 1;
  let pinchStartCenterX = 0, pinchStartCenterY = 0;
  let pinchStartTranslateX = 0, pinchStartTranslateY = 0;
  let isPinching = false;

  function updateTransform() {
    mapContent.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  function initTransform() {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    if (vw < 700) {
      scale = 0.4;
      translateX = 10;
      translateY = 20;
    } else {
      scale = 0.7;
      translateX = (vw - 1500 * scale) / 2 + 120;
      translateY = (vh - 950 * scale) / 2;
    }
    updateTransform();
  }

  function getTouchDistance(t1, t2) {
    const dx = t1.clientX - t2.clientX, dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function getTouchCenter(t1, t2) {
    return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
  }

  // ---------- Мышь ----------
  function onPointerDown(e) {
    if (e.target.closest('.station') || e.target.closest('.route-panel') ||
        e.target.closest('.zoom-controls') || e.target.closest('.legend') ||
        e.target.closest('.top-bar')) return;
    if (e.pointerType && e.pointerType !== 'mouse') return;
    isDragging = true;
    startX = e.clientX; startY = e.clientY;
    startTranslateX = translateX; startTranslateY = translateY;
    viewport.style.cursor = 'grabbing';
    e.preventDefault();
  }
  function onPointerMove(e) {
    if (!isDragging) return;
    if (e.pointerType && e.pointerType !== 'mouse') return;
    translateX = startTranslateX + (e.clientX - startX);
    translateY = startTranslateY + (e.clientY - startY);
    updateTransform();
    e.preventDefault();
  }
  function onPointerUp() {
    isDragging = false;
    viewport.style.cursor = 'grab';
  }

  // ---------- Тач ----------
  function onTouchStart(e) {
    if (e.target.closest('.route-panel') || e.target.closest('.zoom-controls') ||
        e.target.closest('.legend') || e.target.closest('.top-bar')) return;

    if (e.touches.length === 2) {
      isPinching = true; isDragging = false;
      const t1 = e.touches[0], t2 = e.touches[1];
      pinchStartDist = getTouchDistance(t1, t2);
      pinchStartScale = scale;
      pinchStartTranslateX = translateX;
      pinchStartTranslateY = translateY;
      const center = getTouchCenter(t1, t2);
      const rect = viewport.getBoundingClientRect();
      pinchStartCenterX = center.x - rect.left;
      pinchStartCenterY = center.y - rect.top;
      e.preventDefault();
    } else if (e.touches.length === 1) {
      if (e.target.closest('.station')) return;
      isDragging = true;
      isPinching = false;
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY;
      startTranslateX = translateX; startTranslateY = translateY;
    }
  }
  function onTouchMove(e) {
    if (e.target.closest('.route-panel') || e.target.closest('.zoom-controls') ||
        e.target.closest('.legend')) return;

    if (isPinching && e.touches.length === 2) {
      const t1 = e.touches[0], t2 = e.touches[1];
      const dist = getTouchDistance(t1, t2);
      if (pinchStartDist < 1) return;
      const factor = dist / pinchStartDist;
      let newScale = Math.min(3, Math.max(0.2, pinchStartScale * factor));
      const sr = newScale / pinchStartScale;
      translateX = pinchStartCenterX - (pinchStartCenterX - pinchStartTranslateX) * sr;
      translateY = pinchStartCenterY - (pinchStartCenterY - pinchStartTranslateY) * sr;
      scale = newScale;
      updateTransform();
      e.preventDefault();
    } else if (isDragging && e.touches.length === 1 && !e.target.closest('.station')) {
      const t = e.touches[0];
      translateX = startTranslateX + (t.clientX - startX);
      translateY = startTranslateY + (t.clientY - startY);
      updateTransform();
      e.preventDefault();
    }
  }
  function onTouchEnd(e) {
    if (isPinching && e.touches.length < 2) isPinching = false;
    if (isDragging && e.touches.length === 0) isDragging = false;
    if (e.touches.length === 1 && !isPinching) {
      isDragging = true;
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY;
      startTranslateX = translateX; startTranslateY = translateY;
    }
  }

  M.panZoom = {
    init: function () {
      viewport = document.getElementById('viewport');
      mapContent = document.getElementById('mapContent');

      viewport.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      viewport.addEventListener('touchstart', onTouchStart, { passive: false });
      viewport.addEventListener('touchmove', onTouchMove, { passive: false });
      viewport.addEventListener('touchend', onTouchEnd);
      viewport.addEventListener('touchcancel', onTouchEnd);

      viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = -e.deltaY;
        const zoomFactor = delta > 0 ? 1.1 : 0.9;
        const newScale = Math.min(3, Math.max(0.2, scale * zoomFactor));
        const rect = viewport.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const sr = newScale / scale;
        translateX = mx - (mx - translateX) * sr;
        translateY = my - (my - translateY) * sr;
        scale = newScale;
        updateTransform();
      }, { passive: false });

      document.getElementById('zoomIn').addEventListener('click', () => {
        const ns = Math.min(3, scale * 1.2);
        const vw = viewport.clientWidth, vh = viewport.clientHeight;
        const sr = ns / scale;
        translateX = vw / 2 - (vw / 2 - translateX) * sr;
        translateY = vh / 2 - (vh / 2 - translateY) * sr;
        scale = ns;
        updateTransform();
      });
      document.getElementById('zoomOut').addEventListener('click', () => {
        const ns = Math.max(0.2, scale / 1.2);
        const vw = viewport.clientWidth, vh = viewport.clientHeight;
        const sr = ns / scale;
        translateX = vw / 2 - (vw / 2 - translateX) * sr;
        translateY = vh / 2 - (vh / 2 - translateY) * sr;
        scale = ns;
        updateTransform();
      });

      initTransform();
    }
  };

})(window.CatWarMetro = window.CatWarMetro || {});