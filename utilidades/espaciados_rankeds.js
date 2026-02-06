// utilidades/espaciados_rankeds.js
//
// Espaciados para alinear los emojis de rango en Datos de Clasificatorias.
// Los espacios van ANTES del emoji del rango, después del nombre de la cola.
//
// Ejemplo de como se ve:
//   **Solo/Duo** [ESPACIADO AQUI] :emoji: Oro IV 50 LP's
//   **Flexible** [ESPACIADO AQUI] :emoji: Plata II 20 LP's
//   **TFT**      [ESPACIADO AQUI] :emoji: Bronce I 10 LP's
//
// ⚠️ EDITAR LOS ESPACIOS MANUALMENTE ABAJO ⚠️
// No modificar las keys, solo el contenido entre las comillas.

const espaciadosRankeds = {
    'soloq':    '  ',
    'flex':     '       ',
    'tft':      '             ',
    'despuesEmoji': '   '
};

module.exports = {
    espaciadosRankeds
};