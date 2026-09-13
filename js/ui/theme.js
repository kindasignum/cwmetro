/* =========================================================
   ТЁМНАЯ / СВЕТЛАЯ ТЕМА
   ========================================================= */

(function (M) {

  M.theme = {
    init: function () {
      const saved = localStorage.getItem('metro-theme');
      let theme = saved;
      if (!theme) {
        theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      if (theme === 'dark') document.body.classList.add('dark');

      const btn = document.getElementById('themeBtn');
      if (btn) {
        btn.addEventListener('click', () => {
          document.body.classList.toggle('dark');
          localStorage.setItem('metro-theme',
            document.body.classList.contains('dark') ? 'dark' : 'light');
        });
      }
    }
  };

})(window.CatWarMetro = window.CatWarMetro || {});