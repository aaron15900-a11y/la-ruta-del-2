// Escala el escenario de 1920×1080 para que quepa en cualquier pantalla.
(function () {
  var stage = document.getElementById('stage'), wrap = document.getElementById('wrap');
  function fit() {
    var w = wrap.clientWidth, h = wrap.clientHeight, s = Math.min(w / 1920, h / 1080);
    stage.style.transform = 'translate(' + ((w - 1920 * s) / 2) + 'px,' + ((h - 1080 * s) / 2) + 'px) scale(' + s + ')';
  }
  addEventListener('resize', fit);
  addEventListener('orientationchange', function () { setTimeout(fit, 200); });
  fit();
})();
