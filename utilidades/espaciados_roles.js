// utilidades/espaciados_roles.js
// 
// Espaciados para alinear los porcentajes de los roles en el perfil.
// Cada jerarquía tiene un mapeo de espacios para cada rol.
// Si la jerarquía más alta presente es TOP, se usa espaciadoPorRol['TOP'],
// y cada rol dentro busca su espaciado correspondiente.
//
// ⚠️ EDITAR LOS ESPACIOS MANUALMENTE ABAJO ⚠️
// No modificar la estructura, solo el contenido entre las comillas.

const espaciadoPorRol = {
    // Si uno de los 2 roles es Superior
            'TOP': {
                'TOP': ' ',
                'JUNGLE': '  ‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎      ',
                'MIDDLE': '         ',
                'BOTTOM': '          ',
                'UTILITY': '     '
            },
            'UTILITY': {
                'UTILITY': ' ',
                'JUNGLE': '  ‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎     ',
                'MIDDLE': '       ',
                'BOTTOM': '      ',
                'TOP': ''
            },
            'BOTTOM': {
                'BOTTOM': '  ',
                'JUNGLE': '  ‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎ ',
                'MIDDLE': '       ',
                'TOP': '',
                'UTILITY': ''
            },
            'MIDDLE': {
                'MIDDLE': ' ',
                'JUNGLE': '  ',
                'TOP': '',
                'UTILITY': '',
                'BOTTOM': ''
            },
            'JUNGLE': {
                'JUNGLE': ' ',
                'TOP': '',
                'UTILITY': '',
                'BOTTOM': '',
                'MIDDLE': ''
            }
};

module.exports = {
    espaciadoPorRol
};