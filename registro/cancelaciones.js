// registro/cancelaciones.js
const fs = require('fs').promises;
const path = require('path');

// Ruta del archivo de cancelaciones
const CANCELACIONES_FILE = path.join(__dirname, 'cancelaciones.json');

// Cargar cancelaciones desde el archivo
async function cargarCancelaciones() {
    try {
        const data = await fs.readFile(CANCELACIONES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si no existe el archivo, devolver objeto vacío
        return {};
    }
}

// Guardar cancelaciones en el archivo
async function guardarCancelaciones(cancelaciones) {
    try {
        await fs.writeFile(CANCELACIONES_FILE, JSON.stringify(cancelaciones, null, 2));
    } catch (error) {
        console.error('Error al guardar cancelaciones:', error);
    }
}

// Verificar si un usuario está vetado
async function estaVetado(userId) {
    const cancelaciones = await cargarCancelaciones();
    const userData = cancelaciones[userId];
    
    if (!userData || !userData.vetoHasta) {
        return { vetado: false };
    }
    
    const ahora = Date.now();
    
    if (ahora < userData.vetoHasta) {
        // Todavía está vetado
        return { 
            vetado: true, 
            tiempoRestante: Math.ceil((userData.vetoHasta - ahora) / 1000),
            tipoCausa: userData.vetoCausa || 'cancelacion' // Por defecto cancelación
        };
    } else {
        // El veto expiró, limpiar datos
        delete cancelaciones[userId];
        await guardarCancelaciones(cancelaciones);
        return { vetado: false };
    }
}

// Registrar una cancelación
async function registrarCancelacion(userId) {
    const cancelaciones = await cargarCancelaciones();
    
    if (!cancelaciones[userId]) {
        cancelaciones[userId] = {
            contadorCancela: 0,
            contadorTimeout: 0,
            vetoHasta: null,
            vetoCausa: null
        };
    }
    
    cancelaciones[userId].contadorCancela++;
    
    if (cancelaciones[userId].contadorCancela >= 3) {
        // Aplicar veto de 30 minutos
        cancelaciones[userId].vetoHasta = Date.now() + (30 * 60 * 1000);
        cancelaciones[userId].vetoCausa = 'cancelacion';
        cancelaciones[userId].contadorCancela = 0; // Resetear contador
        cancelaciones[userId].contadorTimeout = 0; // Resetear timeout también
    }
    
    await guardarCancelaciones(cancelaciones);
    
    return cancelaciones[userId];
}

// Registrar un timeout
async function registrarTimeout(userId) {
    const cancelaciones = await cargarCancelaciones();
    
    if (!cancelaciones[userId]) {
        cancelaciones[userId] = {
            contadorCancela: 0,
            contadorTimeout: 0,
            vetoHasta: null,
            vetoCausa: null
        };
    }
    
    cancelaciones[userId].contadorTimeout++;
    
    if (cancelaciones[userId].contadorTimeout >= 3) {
        // Aplicar veto de 30 minutos
        cancelaciones[userId].vetoHasta = Date.now() + (30 * 60 * 1000);
        cancelaciones[userId].vetoCausa = 'timeout';
        cancelaciones[userId].contadorCancela = 0; // Resetear cancela también
        cancelaciones[userId].contadorTimeout = 0; // Resetear contador
    }
    
    await guardarCancelaciones(cancelaciones);
    
    return cancelaciones[userId];
}

module.exports = {
    estaVetado,
    registrarCancelacion,
    registrarTimeout
};