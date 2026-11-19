/**
 * La Ruta del 2% · tabla de ganadores en Google Sheets.
 *
 * Pega este archivo en Extensiones > Apps Script de la hoja "La Ruta del 2% · Puntajes"
 * y publícalo como App web (Ejecutar como: yo · Quién tiene acceso: Cualquier persona).
 *
 * POST  (cuerpo JSON)        -> guarda una partida y responde {ok, score, rank, players}
 * GET   ?action=top&n=10     -> responde {ok, top:[{name, group, score, date}], plays}
 *
 * El puntaje se vuelve a calcular aquí con las mismas reglas del juego y se rechazan
 * valores imposibles, para que nadie mande un puntaje inventado tan fácil.
 */

var HOJA = 'Puntajes';
var ENCABEZADOS = ['Fecha', 'Nombre', 'Grupo', 'Puntaje', 'Monedas entregadas', 'Comprobantes',
  'Segundos sobrantes', 'Jefe vencido', 'Bolsillos ajenos', 'Recargos y multas', 'Tiempo jugado (s)', 'Final', 'Partida'];
var PUNTOS = { moneda: 100, comprobante: 50, segundo: 10, jefe: 1500 };
var LIMITES = { monedas: 60, comprobantes: 5, segundos: 225, jugadoMin: 15, jugadoMax: 240 };

function hoja_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(HOJA);
  if (!sh) {
    sh = ss.getSheets()[0];
    if (sh.getLastRow() > 1) sh = ss.insertSheet(HOJA, 0); else sh.setName(HOJA);
  }
  var primera = sh.getRange(1, 1, 1, ENCABEZADOS.length).getValues()[0];
  if (primera.join('|') !== ENCABEZADOS.join('|')) {
    sh.getRange(1, 1, 1, ENCABEZADOS.length).setValues([ENCABEZADOS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  if (!ss.getSheetByName('Ranking')) {
    var rk = ss.insertSheet('Ranking');
    rk.getRange('A1').setFormula('=QUERY(Puntajes!A:M,"select B, C, max(D), count(D) where B is not null group by B, C order by max(D) desc label B \'Nombre\', C \'Grupo\', max(D) \'Mejor puntaje\', count(D) \'Partidas\'",1)');
    rk.getRange('A1:D1').setFontWeight('bold');
  }
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function limpiaTexto_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function entero_(v, min, max) {
  var n = Math.round(Number(v));
  if (!isFinite(n) || n < min || n > max) throw new Error('dato fuera de rango');
  return n;
}

/** Mejor puntaje por jugador (nombre sin importar mayúsculas), de mayor a menor. */
function ranking_(sh) {
  var n = sh.getLastRow() - 1;
  if (n < 1) return { lista: [], partidas: 0 };
  var filas = sh.getRange(2, 1, n, 4).getValues();
  var mejor = {};
  filas.forEach(function (f) {
    var nombre = String(f[1]).trim();
    if (!nombre) return;
    var clave = nombre.toLowerCase();
    var p = Number(f[3]) || 0;
    if (!mejor[clave] || p > mejor[clave].score) {
      mejor[clave] = { name: nombre, group: String(f[2] || ''), score: p, date: f[0] instanceof Date ? f[0].toISOString() : String(f[0]) };
    }
  });
  var lista = Object.keys(mejor).map(function (k) { return mejor[k]; });
  lista.sort(function (a, b) { return b.score - a.score || (a.date < b.date ? -1 : 1); });
  return { lista: lista, partidas: n };
}

function doGet(e) {
  try {
    var sh = hoja_();
    var n = Math.max(1, Math.min(50, Number((e && e.parameter && e.parameter.n) || 10)));
    var r = ranking_(sh);
    return json_({ ok: true, top: r.lista.slice(0, n), players: r.lista.length, plays: r.partidas });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var nombre = limpiaTexto_(d.name, 24);
    if (nombre.length < 2) throw new Error('falta el nombre');
    var grupo = limpiaTexto_(d.group, 12);
    var monedas = entero_(d.coins, 0, LIMITES.monedas);
    var comprobantes = entero_(d.receipts, 0, LIMITES.comprobantes);
    var segundos = entero_(d.tbonus, 0, LIMITES.segundos);
    var jugado = entero_(d.played, LIMITES.jugadoMin, LIMITES.jugadoMax);
    var jefe = d.boss === true;
    var robadas = entero_(d.stolen, 0, 200);
    var multas = entero_(d.fees, 0, 200);
    // tiempo jugado + segundos sobrantes nunca pasa de los 225 s que suman los tres niveles
    if (segundos + jugado > 232) throw new Error('tiempo imposible');
    var puntaje = monedas * PUNTOS.moneda + comprobantes * PUNTOS.comprobante + segundos * PUNTOS.segundo + (jefe ? PUNTOS.jefe : 0);
    var partida = limpiaTexto_(d.run, 24);

    lock.waitLock(20000);
    var sh = hoja_();
    if (partida) {
      var n = sh.getLastRow() - 1;
      if (n > 0) {
        var ids = sh.getRange(2, 13, n, 1).getValues();
        for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === partida) throw new Error('esa partida ya se guardó');
      }
    }
    sh.appendRow([new Date(), nombre, grupo, puntaje, monedas, comprobantes, segundos, jefe ? 'Sí' : 'No',
      robadas, multas, jugado, limpiaTexto_(d.ending, 80), partida]);
    SpreadsheetApp.flush();
    var r = ranking_(sh);
    var lugar = 0;
    for (var j = 0; j < r.lista.length; j++) if (r.lista[j].name.toLowerCase() === nombre.toLowerCase()) { lugar = j + 1; break; }
    return json_({ ok: true, score: puntaje, rank: lugar, players: r.lista.length });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}
