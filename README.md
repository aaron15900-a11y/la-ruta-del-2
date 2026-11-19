# La Ruta del 2%

Minijuego de plataformas que hicimos para la exposición del **Impuesto sobre Actividades Mercantiles e Industriales (ISAMI)** de Baja California, en la materia de Impuestos (UABC, FCASI, LAE).

**Jugar:** https://aaron15900-a11y.github.io/la-ruta-del-2/

Ayudas a Doña Chuy, dueña de una tlapalería en Mexicali, a pagar su ISAMI antes del día 25. En el camino hay trámites infinitos, coyotes que «agilizan» y un tal Lic. Bolsillos con bolsillos sospechosamente grandes. Dura menos de 5 minutos.

> Es una sátira con personajes y lugares ficticios. Exagera la desconfianza ciudadana; no acusa a ninguna persona ni institución real. En nuestra investigación no encontramos pruebas de que el dinero del ISAMI se desvíe. Lo que sí encontramos es que cumplir con el impuesto cuesta mucho para lo poco que recauda (unos 14.6 millones de pesos en 2026).

## Cómo se juega

| Acción | Computadora | Celular o tablet |
| --- | --- | --- |
| Caminar | ← → (o A y D) | Botones ◀ ▶ |
| Saltar | Espacio o ↑ | Botón ⤒ |
| Pausa | Esc | — |

En el celular conviene ponerlo en horizontal. El botón **Pantalla completa** (o la tecla F) agranda el juego; en iPhone se logra abriéndolo desde la pantalla de inicio (Compartir › Agregar a inicio).

1. **La fila del día 25.** Junta los 5 comprobantes y llega a la Ventanilla 3. Esquiva las pilas de trámites y los formatos que caen.
2. **Trámite exprés.** Salta sobre los coyotes para que suelten las monedas que se llevaron.
3. **Los bolsillos del Licenciado.** Salta 3 veces sobre su cabeza para vaciarle los bolsillos.

## Puntaje

| Concepto | Puntos |
| --- | --- |
| Cada moneda que entregas al final | 100 |
| Cada comprobante del nivel 1 | 50 |
| Cada segundo que te sobra al terminar un nivel | 10 |
| Vencer al Lic. Bolsillos | 1,500 |

En la tabla de ganadores cuenta el **mejor puntaje de cada jugador**.

## Tabla de ganadores

Los puntajes se guardan en una hoja de Google Sheets por medio de un pequeño script de Google Apps Script (`apps-script/Codigo.gs`). Cada partida queda en la hoja **Puntajes** y la hoja **Ranking** muestra el mejor puntaje de cada quien.

Ya está conectada a la hoja de Joel. Si algún día hay que volver a conectarla (se hace una sola vez):

1. Abre la hoja *La Ruta del 2% · Puntajes* en Google Drive.
2. Ve a **Extensiones › Apps Script**, borra lo que haya y pega el contenido de `apps-script/Codigo.gs`. Guarda.
3. **Implementar › Nueva implementación › Aplicación web**. En *Ejecutar como* elige **Yo** y en *Quién tiene acceso* elige **Cualquier persona**. Autoriza los permisos que pide Google.
4. Copia la **URL de la aplicación web** (termina en `/exec`) y pégala en `config.js`, en `window.ISAMI_SCORES_URL`.

El script vuelve a calcular cada puntaje y rechaza valores imposibles, pero no es a prueba de todo. Antes de dar premios, revisen la hoja: cada partida tiene fecha, monedas, comprobantes y tiempo jugado.

Sin la URL, el juego funciona igual, pero cada quien sólo ve sus propios puntajes.

## Equipo

Joel Aaron Núñez Flores, Alan Paul Chávez Bustamante, Sandy Yuneli Patiño Carrillo y Ricardo Misael Baca Landeros.
Impuestos · Mtra. Juana Marissa Martínez Saavedra · UABC FCASI · Mexicali, B.C., noviembre de 2026.

Tipografías Fraunces y Public Sans bajo la SIL Open Font License (ver `fonts/`).
