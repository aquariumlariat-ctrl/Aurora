// base_de_datos/sheets_helpers.js
// Funciones auxiliares para operaciones específicas con Google Sheets

const { obtenerClienteSheets, obtenerSpreadsheetId, formatearRango } = require('./sheets');

/**
 * Obtiene el próximo número de registro disponible
 * @returns {Promise<string>} - Número de registro en formato #N
 */
async function obtenerProximoNumero() {
    try {
        const sheets = await obtenerClienteSheets();
        const spreadsheetId = obtenerSpreadsheetId();
        
        // Obtener todas las filas de la columna A (Número de Registro)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'A:A'
        });
        
        const valores = response.data.values || [];
        
        // Contar filas (restar 2: título y fila de encabezados)
        const numeroRegistros = Math.max(0, valores.length - 2);
        
        return `#${numeroRegistros}`;
    } catch (error) {
        console.error('Error al obtener próximo número:', error);
        return '#0';
    }
}

/**
 * Obtiene datos de un usuario por Discord ID
 * @param {string} discordId - ID de Discord del usuario
 * @returns {Promise<Object|null>} - Datos del usuario o null
 */
async function obtenerDatosUsuario(discordId) {
    try {
        const sheets = await obtenerClienteSheets();
        const spreadsheetId = obtenerSpreadsheetId();
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'A:J'
        });
        
        const valores = response.data.values || [];
        const filas = valores.slice(2); // Saltar título y encabezados
        
        const filaUsuario = filas.find(fila => fila[1] === discordId);
        
        if (!filaUsuario) {
            return null;
        }
        
        return {
            numeroRegistro: filaUsuario[0],
            discordId: filaUsuario[1],
            discordUsername: filaUsuario[2],
            riotID: filaUsuario[3],
            region: filaUsuario[4],
            rangoSoloq: filaUsuario[5],
            rangoFlex: filaUsuario[6],
            rangoTFT: filaUsuario[7],
            fechaRegistro: filaUsuario[8],
            puuid: filaUsuario[9]
        };
    } catch (error) {
        console.error('Error al obtener datos de usuario:', error);
        return null;
    }
}

/**
 * Obtiene datos de un usuario por número de registro
 * @param {string} numeroRegistro - Número de registro (#1, #2, etc.)
 * @returns {Promise<Object|null>} - Datos del usuario o null
 */
async function obtenerDatosUsuarioPorNumero(numeroRegistro) {
    try {
        const sheets = await obtenerClienteSheets();
        const spreadsheetId = obtenerSpreadsheetId();
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'A:J'
        });
        
        const valores = response.data.values || [];
        const filas = valores.slice(2);
        
        const filaUsuario = filas.find(fila => fila[0] === numeroRegistro);
        
        if (!filaUsuario) {
            return null;
        }
        
        return {
            numeroRegistro: filaUsuario[0],
            discordId: filaUsuario[1],
            discordUsername: filaUsuario[2],
            riotID: filaUsuario[3],
            region: filaUsuario[4],
            rangoSoloq: filaUsuario[5],
            rangoFlex: filaUsuario[6],
            rangoTFT: filaUsuario[7],
            fechaRegistro: filaUsuario[8],
            puuid: filaUsuario[9]
        };
    } catch (error) {
        console.error('Error al obtener datos por número de registro:', error);
        return null;
    }
}

/**
 * Actualiza el Riot ID de un usuario
 * @param {string} discordId - ID de Discord del usuario
 * @param {string} nuevoRiotID - Nuevo Riot ID
 * @returns {Promise<Object>} - { success: boolean, filaReal?: number }
 */
async function actualizarRiotID(discordId, nuevoRiotID) {
    try {
        const sheets = await obtenerClienteSheets();
        const spreadsheetId = obtenerSpreadsheetId();
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'A:J'
        });
        
        const valores = response.data.values || [];
        const filas = valores.slice(2);
        
        const indiceRelativo = filas.findIndex(fila => fila[1] === discordId);
        
        if (indiceRelativo === -1) {
            console.error('Usuario no encontrado en Sheet para actualizar');
            return { success: false };
        }
        
        const filaReal = indiceRelativo + 3;
        
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `D${filaReal}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[nuevoRiotID]]
            }
        });
        
        console.log(`✅ Riot ID actualizado en Sheet: ${nuevoRiotID}`);
        return { success: true, filaReal };
        
    } catch (error) {
        console.error('Error al actualizar Riot ID en Sheet:', error);
        return { success: false };
    }
}

/**
 * Actualiza los elos/rangos de un usuario
 * @param {string} discordId - ID de Discord del usuario
 * @param {Object} rangos - { soloq, flex, tft }
 * @returns {Promise<boolean>} - true si fue exitoso
 */
async function actualizarElos(discordId, rangos) {
    try {
        const sheets = await obtenerClienteSheets();
        const spreadsheetId = obtenerSpreadsheetId();
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'A:J'
        });
        
        const valores = response.data.values || [];
        const filas = valores.slice(2);
        
        const indiceRelativo = filas.findIndex(fila => fila[1] === discordId);
        
        if (indiceRelativo === -1) {
            console.error('Usuario no encontrado en Sheet para actualizar elos');
            return false;
        }
        
        const filaReal = indiceRelativo + 3;
        
        const rangoSoloqTexto = formatearRango(rangos.soloq);
        const rangoFlexTexto = formatearRango(rangos.flex);
        const rangoTFTTexto = formatearRango(rangos.tft);
        
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `F${filaReal}:H${filaReal}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[rangoSoloqTexto, rangoFlexTexto, rangoTFTTexto]]
            }
        });
        
        console.log(`✅ Elos actualizados en Sheet`);
        return true;
        
    } catch (error) {
        console.error('Error al actualizar elos en Sheet:', error);
        return false;
    }
}

/**
 * Carga todos los Discord IDs registrados
 * @returns {Promise<string[]>} - Array de Discord IDs
 */
async function cargarTodosLosUsuarios() {
    try {
        const sheets = await obtenerClienteSheets();
        const spreadsheetId = obtenerSpreadsheetId();
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'B:B' // Columna B (ID Discord)
        });
        
        const valores = response.data.values || [];
        
        // Saltar las primeras 2 filas (título y encabezados)
        // Filtrar valores vacíos/undefined
        const discordIds = valores
            .slice(2)
            .map(row => row[0])
            .filter(id => id && id.trim() !== '');
        
        return discordIds;
        
    } catch (error) {
        console.error('Error al cargar usuarios desde Sheet:', error);
        return [];
    }
}

module.exports = {
    obtenerProximoNumero,
    obtenerDatosUsuario,
    obtenerDatosUsuarioPorNumero,
    actualizarRiotID,
    actualizarElos,
    cargarTodosLosUsuarios
};

/**
 * Guarda un nuevo registro en Google Sheets con formato completo
 * Esta función maneja TODO el proceso de guardado incluyendo formato
 * @param {Object} datosUsuario - Datos del usuario a registrar
 * @returns {Promise<boolean>} - true si fue exitoso
 */
async function guardarRegistro(datosUsuario) {
    try {
        const sheets = await obtenerClienteSheets();
        const spreadsheetId = obtenerSpreadsheetId();
        
        // Obtener el próximo número de registro
        const numeroRegistro = await obtenerProximoNumero();
        
        // Preparar la fecha en formato corto DD/MM/YYYY
        const fecha = new Date().toLocaleDateString('es-ES', { 
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
        // Preparar los valores (con PUUID)
        const valores = [[
            numeroRegistro,                              // A: Número de Registro
            datosUsuario.discordId,                      // B: ID Discord
            datosUsuario.discordUsername,                // C: Username Discord
            datosUsuario.riotID,                         // D: RIOT ID
            datosUsuario.region,                         // E: Región
            formatearRango(datosUsuario.rangos.soloq),   // F: Clasificación Solo/Duo
            formatearRango(datosUsuario.rangos.flex),    // G: Clasificación Flexible
            formatearRango(datosUsuario.rangos.tft),     // H: Clasificación TFT
            fecha,                                       // I: Fecha de Registro
            datosUsuario.puuid                           // J: PUUID
        ]];
        
        // Agregar la fila
        const appendResponse = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'A:J',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: valores
            }
        });
        
        // Obtener el índice de la fila recién agregada
        const updatedRange = appendResponse.data.updates.updatedRange;
        const filaMatch = updatedRange.match(/[A-Z]+(\d+)/);
        const filaReal = parseInt(filaMatch[1]);
        const filaIndex = filaReal - 1; // Convertir a índice 0-based
        
        // Determinar el color de fondo según par/impar
        const numRegistro = parseInt(numeroRegistro.replace('#', ''));
        const esImpar = numRegistro % 2 !== 0;
        
        // Convertir colores HEX a RGB (0-1)
        let bgColor;
        if (esImpar) {
            // #d9d2e9 -> RGB(217, 210, 233)
            bgColor = { red: 217/255, green: 210/255, blue: 233/255 };
        } else {
            // #f6f3fe -> RGB(246, 243, 254)
            bgColor = { red: 246/255, green: 243/255, blue: 254/255 };
        }
        
        // Aplicar formato completo en una sola operación batchUpdate
        try {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests: [
                        // 1. Color de fondo
                        {
                            repeatCell: {
                                range: {
                                    sheetId: 0,
                                    startRowIndex: filaIndex,
                                    endRowIndex: filaIndex + 1,
                                    startColumnIndex: 0,
                                    endColumnIndex: 10
                                },
                                cell: {
                                    userEnteredFormat: {
                                        backgroundColor: bgColor
                                    }
                                },
                                fields: 'userEnteredFormat.backgroundColor'
                            }
                        },
                        // 2. Bordes
                        {
                            updateBorders: {
                                range: {
                                    sheetId: 0,
                                    startRowIndex: filaIndex,
                                    endRowIndex: filaIndex + 1,
                                    startColumnIndex: 0,
                                    endColumnIndex: 10
                                },
                                top: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
                                bottom: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
                                left: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
                                right: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
                                innerHorizontal: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
                                innerVertical: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } }
                            }
                        },
                        // 3. Centrado horizontal
                        {
                            repeatCell: {
                                range: {
                                    sheetId: 0,
                                    startRowIndex: filaIndex,
                                    endRowIndex: filaIndex + 1,
                                    startColumnIndex: 0,
                                    endColumnIndex: 10
                                },
                                cell: {
                                    userEnteredFormat: {
                                        horizontalAlignment: 'CENTER'
                                    }
                                },
                                fields: 'userEnteredFormat.horizontalAlignment'
                            }
                        },
                        // 4. Text wrapping
                        {
                            repeatCell: {
                                range: {
                                    sheetId: 0,
                                    startRowIndex: filaIndex,
                                    endRowIndex: filaIndex + 1,
                                    startColumnIndex: 0,
                                    endColumnIndex: 10
                                },
                                cell: {
                                    userEnteredFormat: {
                                        wrapStrategy: 'WRAP'
                                    }
                                },
                                fields: 'userEnteredFormat.wrapStrategy'
                            }
                        },
                        // 5. Dropdown de región
                        {
                            setDataValidation: {
                                range: {
                                    sheetId: 0,
                                    startRowIndex: filaIndex,
                                    endRowIndex: filaIndex + 1,
                                    startColumnIndex: 4,
                                    endColumnIndex: 5
                                },
                                rule: {
                                    condition: {
                                        type: 'ONE_OF_LIST',
                                        values: [
                                            { userEnteredValue: 'LAN' },
                                            { userEnteredValue: 'LAS' },
                                            { userEnteredValue: 'NA' },
                                            { userEnteredValue: 'BR' }
                                        ]
                                    },
                                    showCustomUi: true,
                                    strict: true
                                }
                            }
                        }
                    ]
                }
            });
        } catch (formatError) {
            console.error('⚠️ Error al aplicar formato:', formatError.message);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error al guardar en Google Sheets:', error);
        return false;
    }
}

// Agregar guardarRegistro al export
module.exports.guardarRegistro = guardarRegistro;



/**
 * Actualiza el color personalizado del perfil de un usuario
 * @param {string} discordId - ID de Discord del usuario
 * @param {string} color - Color hex (ej: #FF5733)
 * @returns {Promise<boolean>} - true si fue exitoso
 */
async function actualizarColorPerfil(discordId, color) {
    try {
        const sheets = await obtenerClienteSheets();
        const spreadsheetId = obtenerSpreadsheetId();
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'A:K'
        });
        
        const valores = response.data.values || [];
        const filas = valores.slice(2);
        
        const indiceRelativo = filas.findIndex(fila => fila[1] === discordId);
        
        if (indiceRelativo === -1) {
            console.error('Usuario no encontrado en Sheet para actualizar color');
            return false;
        }
        
        const filaReal = indiceRelativo + 3;
        
        // Actualizar columna K (Color)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `K${filaReal}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[color]]
            }
        });
        
        console.log(`✅ Color actualizado en Sheet: ${color}`);
        return true;
        
    } catch (error) {
        console.error('Error al actualizar color en Sheet:', error);
        return false;
    }
}

// Agregar al export
module.exports.actualizarColorPerfil = actualizarColorPerfil;

// Función para verificar y actualizar Riot ID si cambió
/**
 * Verifica si el Riot ID actual coincide con el guardado
 * Si cambió, actualiza en Sheets y en JSON de perfiles
 * @param {string} discordId - ID del usuario de Discord
 * @param {string} puuid - PUUID de la cuenta
 * @param {string} riotIDGuardado - Riot ID actualmente guardado
 * @returns {Promise<Object>} - { cambio: boolean, riotIDNuevo?: string }
 */
async function verificarYActualizarRiotID(discordId, puuid, riotIDGuardado) {
    try {
        const { obtenerRiotIDActual } = require('../apis/lol_api');
        const { actualizarPersonalizacion } = require('./perfiles_helpers');
        
        // Obtener el Riot ID actual desde Riot API usando PUUID
        const riotIDActual = await obtenerRiotIDActual(puuid);
        
        if (!riotIDActual) {
            console.log(`⚠️ No se pudo obtener Riot ID actual para usuario ${discordId}`);
            return { cambio: false };
        }
        
        const { riotID: riotIDNuevo } = riotIDActual;
        
        // Comparar Riot IDs
        if (riotIDNuevo === riotIDGuardado) {
            console.log(`✅ Riot ID sin cambios: ${riotIDNuevo}`);
            return { cambio: false };
        }
        
        // ¡RIOT ID CAMBIÓ!
        console.log(`🔄 Riot ID cambió: ${riotIDGuardado} → ${riotIDNuevo}`);
        
        // Actualizar en Google Sheets
        const resultadoSheet = await actualizarRiotID(discordId, riotIDNuevo);
        if (resultadoSheet.success) {
            console.log(`✅ Riot ID actualizado en Google Sheets`);
        } else {
            console.error(`❌ Error al actualizar Riot ID en Google Sheets`);
        }
        
        // Actualizar en JSON de perfiles (perfiles_lol_datos.json)
        const resultadoJSON = await actualizarPersonalizacion(discordId, { riotID: riotIDNuevo });
        if (resultadoJSON) {
            console.log(`✅ Riot ID actualizado en perfiles_lol_datos.json`);
        } else {
            console.error(`❌ Error al actualizar Riot ID en JSON`);
        }
        
        return { 
            cambio: true, 
            riotIDNuevo,
            sheetActualizado: resultadoSheet.success,
            jsonActualizado: resultadoJSON
        };
        
    } catch (error) {
        console.error(`❌ Error al verificar/actualizar Riot ID para usuario ${discordId}:`, error.message);
        return { cambio: false, error: error.message };
    }
}

// Agregar al export
module.exports.verificarYActualizarRiotID = verificarYActualizarRiotID;