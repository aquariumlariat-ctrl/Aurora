// personalizar/personalizar.js
const mensajes = require('./mensajes');

// Guardar el estado de cada usuario en proceso de personalización
const usuariosEnPersonalizacion = new Map();

async function ejecutar(message) {
    const esEnDM = message.channel.isDMBased();
    console.log('=== Ejecutando personalizar ===');
    console.log('Es en DM:', esEnDM);
    
    // Si NO es DM, verificar si ya tiene un proceso en curso
    if (!esEnDM) {
        const tieneProcesoActivo = usuariosEnPersonalizacion.has(message.author.id);
        if (tieneProcesoActivo) {
            await message.reply(mensajes.UsuarioEnPersonalizacion(message.author));
            return;
        }
    }
    
    try {
        // Intentar crear DM
        const dmChannel = esEnDM ? message.channel : await message.author.createDM();
        
        // Limpiar mensajes anteriores de personalización en DM
        const mensajesPrevios = await dmChannel.messages.fetch({ limit: 50 });
        
        const mensajesPersonalizacion = mensajesPrevios.filter(msg => 
            msg.author.id === message.client.user.id && 
            (msg.content.includes('Vamos a personalizar tu perfil') ||
            msg.content.includes('¿Que quieres editar?'))
        );
        
        for (const [, msgBot] of mensajesPersonalizacion) {
            const mensajesDespues = mensajesPrevios.filter(msg => 
                msg.author.id === message.author.id && 
                msg.createdTimestamp > msgBot.createdTimestamp
            );
            
            if (mensajesDespues.size === 0) {
                await msgBot.delete().catch(() => {});
            }
        }
        
        // Registrar inicio del proceso
        const tiempoInicio = Date.now();
        usuariosEnPersonalizacion.set(message.author.id, { 
            etapa: 'menu',
            tiempoInicio: tiempoInicio
        });
        
        const client = message.client;
        
        // Timeout de 1 hora (3600000 ms)
        setTimeout(async () => {
            const estadoActual = usuariosEnPersonalizacion.get(message.author.id);
            if (estadoActual && estadoActual.tiempoInicio === tiempoInicio) {
                usuariosEnPersonalizacion.delete(message.author.id);
                
                try {
                    await dmChannel.send(mensajes.TimeoutPersonalizacion());
                } catch (error) {
                    console.error('Error al enviar mensaje de timeout:', error);
                }
            }
        }, 3600000); // 1 hora
        
        // Si NO estamos en DM, responder en el canal
        if (!esEnDM) {
            await message.reply(mensajes.LlamadoCustomPerfil(message.author));
        }
        
        // Enviar mensaje de arranque con menú de opciones
        await dmChannel.send(mensajes.ArranqueCustomPerfil());
        
        // Crear collector para esperar respuesta del usuario
        const filter = m => m.author.id === message.author.id;
        const collector = dmChannel.createMessageCollector({ filter, time: 3600000 });
        
        collector.on('collect', async (m) => {
            const estado = usuariosEnPersonalizacion.get(message.author.id);
            if (!estado) return;
            
            // Cancelación
            if (m.content.toLowerCase() === 'aurora!cancelar') {
                usuariosEnPersonalizacion.delete(message.author.id);
                await dmChannel.send(mensajes.CancelacionPersonalizacion());
                collector.stop();
                return;
            }
            
            // Menu principal - esperar número del 1 al 6
            if (estado.etapa === 'menu') {
                const opcion = m.content.trim();
                
                if (!['1', '2', '3', '4', '5', '6', '#1', '#2', '#3', '#4', '#5', '#6'].includes(opcion)) {
                    await dmChannel.send(mensajes.OpcionInvalida());
                    return;
                }
                
                // Extraer número
                const numero = opcion.replace('#', '');
                
                switch(numero) {
                    case '1':
                        await dmChannel.send('**Biografía** - Funcionalidad próximamente disponible.');
                        break;
                    case '2':
                        await dmChannel.send('**Color** - Funcionalidad próximamente disponible.');
                        break;
                    case '3':
                        await dmChannel.send('**Fijar campeón favorito** - Funcionalidad próximamente disponible.');
                        break;
                    case '4':
                        await dmChannel.send('**Agregar redes sociales** - Funcionalidad próximamente disponible.');
                        break;
                    case '5':
                        await dmChannel.send('**Avatar** - Funcionalidad próximamente disponible.');
                        break;
                    case '6':
                        await dmChannel.send('**Cartel** - Funcionalidad próximamente disponible.');
                        break;
                }
                
                // Por ahora, cerrar el proceso después de seleccionar
                usuariosEnPersonalizacion.delete(message.author.id);
                collector.stop();
            }
        });
        
        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                usuariosEnPersonalizacion.delete(message.author.id);
            }
        });
        
    } catch (error) {
        console.error('Error al crear DM:', error);
        
        // Solo responder si NO estamos ya en DM
        if (!esEnDM) {
            await message.reply(mensajes.FalloCustomPerfil(message.author));
        }
    }
}

module.exports = {
    ejecutar,
    usuariosEnPersonalizacion
};