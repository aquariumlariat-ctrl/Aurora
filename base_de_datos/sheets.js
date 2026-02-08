// base_de_datos/sheets.js
// Módulo principal para operaciones con Google Sheets
// Centraliza autenticación, formateo y operaciones base

const { google } = require('googleapis');
require('dotenv').config();

/**
 * Obtiene credenciales de Google Service Account desde variables de entorno
 * @returns {Object|null} - Credenciales o null si hay error
 */
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

/**
 * Autentica con Google Sheets API
 * @returns {Promise<Object>} - Cliente autenticado
 * @throws {Error} Si no se pueden cargar las credenciales
 */
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

/**
 * Obtiene un cliente de Google Sheets autenticado
 * @returns {Promise<Object>} - Cliente de Sheets autenticado
 */
async function obtenerClienteSheets() {
    const authClient = await autenticar();
    return google.sheets({ version: 'v4', auth: authClient });
}

/**
 * Traduce tier de League of Legends de inglés a español
 * @param {string} tier - Tier en inglés (IRON, BRONZE, etc.)
 * @returns {string} - Tier en español
 */
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

/**
 * Formatea un objeto de rango para mostrar en español (sin LP)
 * @param {Object|null} rango - Objeto con tier, rank, lp
 * @returns {string} - Rango formateado
 */
function formatearRango(rango) {
    if (!rango) {
        return 'Sin Clasificación';
    }
    
    const tierTraducido = traducirTier(rango.tier);
    
    // Master, Grandmaster y Challenger no tienen división
    if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rango.tier)) {
        return tierTraducido;
    }
    
    // Resto de rangos con división
    return `${tierTraducido} ${rango.rank}`;
}

/**
 * Obtiene el spreadsheet ID desde variables de entorno
 * @returns {string} - ID del spreadsheet
 */
function obtenerSpreadsheetId() {
    return process.env.GOOGLE_SHEET_ID;
}

module.exports = {
    obtenerCredenciales,
    autenticar,
    obtenerClienteSheets,
    traducirTier,
    formatearRango,
    obtenerSpreadsheetId
};