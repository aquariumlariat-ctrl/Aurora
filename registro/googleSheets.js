// registro/googleSheets.js
const { google } = require('googleapis');
require('dotenv').config();

// Configuración de las credenciales desde .env
function obtenerCredenciales() {
    try {
        const credentials = {
            type: 'service_account',
            project_id: process.env.GOOGLE_PROJECT_ID,
            private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            client_id: process.env.GOOGLE_CLIENT_ID,
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL
        };
        
        return credentials;
    } catch (error) {
        console.error('Error al cargar credenciales:', error);
        return null;
    }
}

// Autenticar con Google Sheets
async function autenticar() {
    const credentials = obtenerCredenciales();
    
    if (!credentials) {
        throw new Error('No se pudieron cargar las credenciales de Google');
    }
    
    const auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    return await auth.getClient();
}

// Traducir tier al español
function traducirTier(tier) {
    const traducciones = {
        'IRON': 'Hierro',
        'BRONZE': 'Bronce',
        'SILVER': 'Plata',
        'GOLD': 'Oro',
        'PLATINUM': 'Platino',
        'EMERALD': 'Esmeralda',
        'DIAMOND': 'Diamante',
        'MASTER': 'Maestro',
        'GRANDMASTER': 'Gran Maestro',
        'CHALLENGER': 'Challenger'
    };
    
    return traducciones[tier] || tier;
}

// Formatear rango para mostrar (sin LP, en español, solo mayús inicial)
function formatearRango(rango) {
    if (!rango) {
        return 'Sin Clasificación';
    }
    
    const tierTraducido = traducirTier(rango.tier);
    
    // Para Master, Grandmaster y Challenger (sin división)
    if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rango.tier)) {
        return tierTraducido;
    }
    
    // Para el resto de rangos (con división)
    return `${tierTraducido} ${rango.rank}`;
}

// Obtener el próximo número de registro
async function obtenerProximoNumero(sheets, spreadsheetId) {
    try {
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

// Guardar registro en Google Sheets
async function guardarRegistro(datosUsuario) {
    try {
        const authClient = await autenticar();
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        
        // Obtener el próximo número de registro
        const numeroRegistro = await obtenerProximoNumero(sheets, spreadsheetId);
        
        // Preparar la fecha en formato corto DD/MM/YYYY
        const fecha = new Date().toLocaleDateString('es-ES', { 
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
        // Preparar los valores (sin PUUID, con nuevo orden)
        const valores = [[
            numeroRegistro,                              // A: Número de Registro
            datosUsuario.discordId,                      // B: ID Discord
            datosUsuario.discordUsername,                // C: Username Discord
            datosUsuario.riotID,                         // D: RIOT ID
            datosUsuario.region,                         // E: Región
            formatearRango(datosUsuario.rangos.soloq),   // F: Clasificación Solo/Duo
            formatearRango(datosUsuario.rangos.flex),    // G: Clasificación Flexible
            formatearRango(datosUsuario.rangos.tft),     // H: Clasificación TFT
            fecha                                        // I: Fecha de Registro
        ]];
        
        // Agregar la fila
        const appendResponse = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'A:I',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: valores
            }
        });
        
        // Obtener el índice de la fila recién agregada
        const updatedRange = appendResponse.data.updates.updatedRange;
        console.log('📍 Debug - updatedRange:', updatedRange);
        
        // Extraer el número de fila del updatedRange
        // Ejemplo: "'Hoja 1'!A5:I5" -> extraer el 5
        // Busca un número que viene después de una letra (notación A1)
        const filaMatch = updatedRange.match(/[A-Z]+(\d+)/);
        const filaReal = parseInt(filaMatch[1]); // Número de fila real (1-based)
        const filaIndex = filaReal - 1; // Convertir a índice 0-based
        
        console.log('📍 Debug - Fila real:', filaReal);
        console.log('📍 Debug - Fila index (0-based):', filaIndex);
        
        // Determinar el color de fondo según si el número de registro es par o impar
        // numeroRegistro es "#0", "#1", "#2", etc.
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
        
        console.log('🎨 Color de fondo:', esImpar ? '#d9d2e9 (impar)' : '#f6f3fe (par)');
        
        // Aplicar bordes, centrado, color y dropdown en una sola operación batchUpdate
        try {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests: [
                        // 1. Aplicar color de fondo a toda la fila
                        {
                            repeatCell: {
                                range: {
                                    sheetId: 0,
                                    startRowIndex: filaIndex,
                                    endRowIndex: filaIndex + 1,
                                    startColumnIndex: 0,
                                    endColumnIndex: 9
                                },
                                cell: {
                                    userEnteredFormat: {
                                        backgroundColor: bgColor
                                    }
                                },
                                fields: 'userEnteredFormat.backgroundColor'
                            }
                        },
                        // 2. Aplicar bordes
                        {
                            updateBorders: {
                                range: {
                                    sheetId: 0,
                                    startRowIndex: filaIndex,
                                    endRowIndex: filaIndex + 1,
                                    startColumnIndex: 0,
                                    endColumnIndex: 9
                                },
                                top: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
                                bottom: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
                                left: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
                                right: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
                                innerHorizontal: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
                                innerVertical: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } }
                            }
                        },
                        // 3. Centrar horizontalmente toda la fila
                        {
                            repeatCell: {
                                range: {
                                    sheetId: 0,
                                    startRowIndex: filaIndex,
                                    endRowIndex: filaIndex + 1,
                                    startColumnIndex: 0,
                                    endColumnIndex: 9
                                },
                                cell: {
                                    userEnteredFormat: {
                                        horizontalAlignment: 'CENTER'
                                    }
                                },
                                fields: 'userEnteredFormat.horizontalAlignment'
                            }
                        },
                        // 4. Aplicar dropdown de región en columna E
                        {
                            setDataValidation: {
                                range: {
                                    sheetId: 0,
                                    startRowIndex: filaIndex,
                                    endRowIndex: filaIndex + 1,
                                    startColumnIndex: 4, // Columna E (0-based)
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
            
            console.log('✅ Formato aplicado correctamente (color, bordes, centrado, dropdown)');
        } catch (formatError) {
            console.error('⚠️ Error al aplicar formato:', formatError.message);
        }
        
        console.log('✅ Registro guardado en Google Sheets exitosamente');
        console.log(`   Número de registro: ${numeroRegistro}`);
        console.log(`   Fila: ${filaReal}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error al guardar en Google Sheets:', error);
        return false;
    }
}

module.exports = {
    guardarRegistro
};