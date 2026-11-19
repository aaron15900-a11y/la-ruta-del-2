// Botón de pantalla completa. En iPhone el navegador no lo permite: ahí se explica cómo
// abrir el juego desde la pantalla de inicio, que sí lo muestra a pantalla completa.
(function () {
  var btn = document.getElementById('fs'), tip = document.getElementById('fs-tip'), root = document.documentElement;
  var req = root.requestFullscreen || root.webkitRequestFullscreen;
  var isFull = function () { return !!(document.fullscreenElement || document.webkitFullscreenElement); };
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (standalone) { btn.style.display = 'none'; document.body.classList.add('full'); }
  function sync() {
    var f = isFull();
    btn.classList.toggle('on', f);
    btn.setAttribute('aria-label', f ? 'Salir de pantalla completa' : 'Pantalla completa');
    btn.querySelector('span').textContent = f ? 'Salir' : 'Pantalla completa';
    document.body.classList.toggle('full', f || standalone);
    window.dispatchEvent(new Event('resize'));
  }
  function showTip(t) { tip.textContent = t; tip.classList.add('on'); clearTimeout(showTip.t); showTip.t = setTimeout(function () { tip.classList.remove('on'); }, 6000); }
  btn.addEventListener('click', function (e) {
    e.stopPropagation(); btn.blur();
    if (isFull()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    if (!req) { showTip('En iPhone: toca Compartir y luego «Agregar a inicio». Abre el juego desde ese ícono y se verá en pantalla completa.'); return; }
    var p = req.call(root, { navigationUI: 'hide' });
    if (p && p.then) p.then(function () {
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {});
    }).catch(function () { showTip('Tu navegador no dejó abrir la pantalla completa.'); });
  });
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
  // tecla F para entrar o salir (sin interferir cuando se escribe el nombre)
  addEventListener('keydown', function (e) {
    if ((e.key === 'f' || e.key === 'F') && !/INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName)) btn.click();
  });
  sync();
})();
