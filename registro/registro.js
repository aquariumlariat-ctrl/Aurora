// registro/registro.js
const mensajes = require('./mensajes');
const { crearEmbedPerfil } = require('./EmbedRegistro');
const { obtenerChampionPorId } = require('../utilidades/emotes');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

// Guardar el estado de cada usuario en proceso de registro
const usuariosEnRegistro = new Map();

// Mapeo de regiones a plataformas de Riot
const regionAPlatforma = {
    'LAN': 'la1',
    'LAS': 'la2',
    'NA': 'na1',
    'BR': 'br1'
};

// Función para verificar cuenta en Riot API
async function verificarCuentaRiot(gameName, tagLine, region) {
    const routing = 'americas'; // LAN, LAS, NA, BR usan americas
    const url = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    
    console.log('Verificando cuenta - gameName:', gameName);
    console.log('Verificando cuenta - tagLine:', tagLine);
    console.log('Verificando cuenta - URL:', url);
    
    try {
        const response = await fetch(url, {
            headers: {
                'X-Riot-Token': process.env.RIOT_API_KEY
            }
        });
        
        console.log('Status de respuesta verificación:', response.status);
        
        if (response.status === 200) {
            const data = await response.json();
            console.log('Datos de verificación:', data);
            return { existe: true, data };
        } else if (response.status === 404) {
            return { existe: false };
        } else {
            console.error('Error en API Riot:', response.status);
            return { existe: false, error: true };
        }
    } catch (error) {
        console.error('Error al verificar cuenta:', error);
        return { existe: false, error: true };
    }
}

// Función para obtener información del summoner
async function obtenerSummoner(puuid, plataforma) {
    const url = `https://${plataforma}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    
    console.log('Obteniendo summoner - PUUID:', puuid);
    console.log('Obteniendo summoner - Plataforma:', plataforma);
    console.log('Obteniendo summoner - URL:', url);
    
    try {
        const response = await fetch(url, {
            headers: {
                'X-Riot-Token': process.env.RIOT_API_KEY
            }
        });
        
        console.log('Status de respuesta summoner:', response.status);
        
        if (response.status === 200) {
            const data = await response.json();
            console.log('Datos del summoner:', data);
            return data;
        }
        return null;
    } catch (error) {
        console.error('Error al obtener summoner:', error);
        return null;
    }
}

// Función para obtener rangos del jugador
async function obtenerRangos(puuid, plataforma) {
    const url = `https://${plataforma}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'X-Riot-Token': process.env.RIOT_API_KEY
            }
        });
        
        console.log('Status de respuesta rangos:', response.status);
        console.log('PUUID:', puuid);
        console.log('Plataforma:', plataforma);
        
        if (response.status === 200) {
            const data = await response.json();
            console.log('Datos de rangos:', data); // TEMPORAL PARA DEBUG
            const rangos = {
                soloq: null,
                flex: null
            };
            
            data.forEach(queue => {
                if (queue.queueType === 'RANKED_SOLO_5x5') {
                    rangos.soloq = {
                        tier: queue.tier,
                        rank: queue.rank,
                        lp: queue.leaguePoints
                    };
                } else if (queue.queueType === 'RANKED_FLEX_SR') {
                    rangos.flex = {
                        tier: queue.tier,
                        rank: queue.rank,
                        lp: queue.leaguePoints
                    };
                }
            });
            
            return rangos;
        }
        return { soloq: null, flex: null };
    } catch (error) {
        console.error('Error al obtener rangos:', error);
        return { soloq: null, flex: null };
    }
}

// Función para obtener campeones con más maestría
async function obtenerCampeonesFavoritos(puuid, plataforma) {
    const url = `https://${plataforma}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=3`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'X-Riot-Token': process.env.RIOT_API_KEY
            }
        });
        
        if (response.status === 200) {
            const data = await response.json();
            
            // Obtener nombres y emojis de los campeones
            const campeones = await Promise.all(
                data.map(async (campeon) => {
                    const champData = await obtenerChampionPorId(campeon.championId);
                    return {
                        championId: campeon.championId,
                        championName: champData.name,
                        championEmoji: champData.emoji,
                        championPoints: campeon.championPoints
                    };
                })
            );
            
            return campeones;
        }
        return [];
    } catch (error) {
        console.error('Error al obtener campeones favoritos:', error);
        return [];
    }
}

// Mapeo de queue IDs a nombres
const queueNames = {
    400: 'Normal',
    420: 'Solo/Duo',
    430: 'Normal',
    440: 'Flexible',
    450: 'ARAM',
    700: 'Clash',
    830: 'Bots Intro',
    840: 'Bots Principiante',
    850: 'Bots Intermedio',
    900: 'URF',
    1020: 'One For All',
    1300: 'Nexus Blitz',
    1400: 'Spellbook Definitivo',
    1900: 'Pick URF',
    // Agregar más si es necesario
};

// Función para obtener las últimas 3 partidas (solo normales, rankeds, ARAM, clash)
async function obtenerUltimasPartidas(puuid, plataforma) {
    const routing = 'americas'; // LAN, LAS, NA, BR usan americas
    
    // IDs de colas que queremos mostrar
    const colasPermitidas = [400, 420, 430, 440, 450, 700]; // Normal Draft, Solo/Duo, Normal Blind, Flexible, ARAM, Clash
    
    try {
        // Obtener lista de partidas (últimas 20 para tener suficientes después de filtrar)
        const matchListUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20`;
        const matchListResponse = await fetch(matchListUrl, {
            headers: {
                'X-Riot-Token': process.env.RIOT_API_KEY
            }
        });
        
        if (matchListResponse.status !== 200) {
            return [];
        }
        
        const matchList = await matchListResponse.json();
        
        if (!matchList || matchList.length === 0) {
            return [];
        }
        
        // Obtener detalles de cada partida y filtrar
        const partidasFiltradas = [];
        
        for (const matchId of matchList) {
            // Si ya tenemos 3 partidas, detenerse
            if (partidasFiltradas.length >= 3) {
                break;
            }
            
            try {
                const matchUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
                const matchResponse = await fetch(matchUrl, {
                    headers: {
                        'X-Riot-Token': process.env.RIOT_API_KEY
                    }
                });
                
                if (matchResponse.status !== 200) {
                    continue;
                }
                
                const matchData = await matchResponse.json();
                const queueId = matchData.info.queueId;
                
                console.log('Queue ID:', queueId, 'Queue Name:', queueNames[queueId] || 'Desconocida');
                
                // Solo procesar si la cola está en la lista permitida
                if (!colasPermitidas.includes(queueId)) {
                    continue;
                }
                
                // Encontrar los datos del jugador en la partida
                const participantData = matchData.info.participants.find(p => p.puuid === puuid);
                
                if (!participantData) {
                    continue;
                }
                
                // Obtener información del campeón
                const champData = await obtenerChampionPorId(participantData.championId);
                
                const queueName = queueNames[queueId] || 'Partida';
                
                partidasFiltradas.push({
                    queueName: queueName,
                    championName: champData.name,
                    championEmoji: champData.emoji,
                    win: participantData.win
                });
            } catch (error) {
                console.error('Error al obtener detalles de partida:', error);
                continue;
            }
        }
        
        return partidasFiltradas;
    } catch (error) {
        console.error('Error al obtener últimas partidas:', error);
        return [];
    }
}

async function ejecutar(message) {
    // Enviar mensaje privado primero
    try {
        const dmChannel = await message.author.createDM();
        
        // Buscar mensajes previos del bot en el DM
        const mensajesPrevios = await dmChannel.messages.fetch({ limit: 50 });
        
        // Filtrar mensajes de registro del bot
        const mensajesRegistro = mensajesPrevios.filter(msg => 
            msg.author.id === message.client.user.id && 
            (msg.content.includes('Bienvenido al proceso de registro') ||
            msg.content.includes('Empecemos con el registro de tu cuenta de League of Legends.'))
        );
        
        // Borrar solo si el usuario no respondió después del mensaje de registro
        for (const [, msgBot] of mensajesRegistro) {
            // Buscar si hay algún mensaje del usuario después de este mensaje del bot
            const mensajesDespues = mensajesPrevios.filter(msg => 
                msg.author.id === message.author.id && 
                msg.createdTimestamp > msgBot.createdTimestamp
            );
            
            // Si NO hay mensajes del usuario después, borrar el mensaje del bot
            if (mensajesDespues.size === 0) {
                await msgBot.delete().catch(() => {});
            }
        }
        
        // Marcar usuario en proceso de registro - esperando Riot ID
        const tiempoInicio = Date.now();
        usuariosEnRegistro.set(message.author.id, { 
            etapa: 'riotid',
            tiempoInicio: tiempoInicio
        });
        
        // Timer de 1 hora para timeout
        setTimeout(async () => {
            const estadoActual = usuariosEnRegistro.get(message.author.id);
            // Solo hacer timeout si el usuario sigue en proceso y es el mismo proceso
            if (estadoActual && estadoActual.tiempoInicio === tiempoInicio) {
                usuariosEnRegistro.delete(message.author.id);
                try {
                    await message.author.send(mensajes.TimeOutRegistro());
                } catch (error) {
                    // Ignorar si no se puede enviar DM
                }
            }
        }, 60 * 60 * 1000); // 1 hora
        
        // Enviar el nuevo mensaje
        await message.author.send(mensajes.ArranqueRegistro);
        
        // Si el DM funcionó, responder en el canal
        await message.reply(mensajes.LlamadoRegistro(message.author));
    } catch (error) {
        // Si no se pudo enviar DM, avisar
        await message.reply(mensajes.FalloLlamadoRegistro(message.author));
    }
}

async function procesarRespuestaDM(message) {
    const userId = message.author.id;
    const estadoUsuario = usuariosEnRegistro.get(userId);
    
    // Si el usuario no está en proceso de registro, ignorar
    if (!estadoUsuario) return;
    
    // Comando secreto para probar timeout (solo para testing)
    if (message.content === 'Aurora!RTO') {
        usuariosEnRegistro.delete(userId);
        await message.reply(mensajes.TimeOutRegistro());
        return;
    }
    
    // Verificar si el usuario quiere cancelar
    if (message.content.toLowerCase() === 'aurora!cancelar') {
        usuariosEnRegistro.delete(userId);
        await message.reply(mensajes.FinRegistro());
        return;
    }
    
    // Procesar según la etapa
    if (estadoUsuario.etapa === 'riotid') {
        await validarRiotID(message, estadoUsuario);
    } else if (estadoUsuario.etapa === 'region') {
        await validarRegion(message, estadoUsuario);
    }
}

async function validarRiotID(message, estadoUsuario) {
    const riotID = message.content.trim();
    
    // Validar formato: debe tener # y texto antes y después
    if (!riotID.includes('#')) {
        await message.reply(mensajes.TAGIncorrectoRegistro);
        return;
    }
    
    const [nombre, tag] = riotID.split('#');
    
    if (!nombre || !tag) {
        await message.reply(mensajes.IDIncorrectoRegistro);
        return;
    }
    
    // Si la validación pasó, guardar y pedir región
    estadoUsuario.riotID = riotID;
    estadoUsuario.etapa = 'region';
    usuariosEnRegistro.set(message.author.id, estadoUsuario);
    
    await message.reply(mensajes.RegionRegistro(riotID));
}

async function validarRegion(message, estadoUsuario) {
    const region = message.content.trim().toUpperCase();
    const regionesValidas = ['LAN', 'LAS', 'NA', 'BR'];
    
    // Validar que la región sea válida
    if (!regionesValidas.includes(region)) {
        await message.reply(mensajes.RegionInvalidaRegistro);
        return;
    }
    
    // Guardar región temporalmente
    estadoUsuario.region = region;
    
    // Separar el Riot ID en gameName y tagLine
    const [gameName, tagLine] = estadoUsuario.riotID.split('#');
    
    // Verificar cuenta en Riot API
    const resultado = await verificarCuentaRiot(gameName, tagLine, region);
    
    if (resultado.existe) {
        // Cuenta encontrada - obtener información adicional
        const plataforma = regionAPlatforma[region];
        const puuid = resultado.data.puuid;
        
        // Obtener datos del summoner
        const summoner = await obtenerSummoner(puuid, plataforma);
        
        if (!summoner) {
            await message.reply('Error al obtener información del summoner.');
            return;
        }
        
        // Obtener rangos
        const rangos = await obtenerRangos(puuid, plataforma);
        
        // Obtener campeones favoritos
        const campeonesFavoritos = await obtenerCampeonesFavoritos(puuid, plataforma);
        
        // Obtener últimas 3 partidas
        const ultimasPartidas = await obtenerUltimasPartidas(puuid, plataforma);
        
        // Guardar datos completos en el estado (NO eliminar hasta confirmar)
        estadoUsuario.etapa = 'confirmacion';
        estadoUsuario.riotID = `${resultado.data.gameName}#${resultado.data.tagLine}`;
        estadoUsuario.region = region;
        estadoUsuario.puuid = puuid;
        usuariosEnRegistro.set(message.author.id, estadoUsuario);
        
        // Preparar datos para el embed
        const datosJugador = {
            riotID: `${resultado.data.gameName}#${resultado.data.tagLine}`, // Usar el formato correcto de la API
            region: region,
            iconoId: summoner.profileIconId,
            rangos: rangos,
            campeonesFavoritos: campeonesFavoritos,
            ultimasPartidas: ultimasPartidas
        };
        
        // Crear y enviar embed (await porque ahora es async)
        const embed = await crearEmbedPerfil(datosJugador);
        
        // Crear botones
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirmar_cuenta')
                    .setLabel('✓ Confirmar')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('reintentar_cuenta')
                    .setLabel('↻ Comenzar de nuevo')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        await message.reply({ 
            content: 'Revisé mis archivos mágicos con la información que me diste. <:AuroraTea:1465551396848930901>\nEncontré esta cuenta… ¿Es la que quieres registrar?\nConfirma con los botones de abajo o dime y empezamos otra vez.',
            embeds: [embed],
            components: [row]
        });
    } else {
        // Cuenta no encontrada - volver a pedir Riot ID
        estadoUsuario.etapa = 'riotid';
        usuariosEnRegistro.set(message.author.id, estadoUsuario);
        await message.reply(mensajes.CuentaNoEncontradaRegistro);
    }
}

// Función de test para saltar directo al embed
async function testEmbed(message) {
    const gameName = 'cachorracachonda';
    const tagLine = 'juzo';
    const region = 'LAN';
    const plataforma = regionAPlatforma[region];
    
    await message.reply('Generando embed de prueba...');
    
    try {
        // Verificar cuenta
        const resultado = await verificarCuentaRiot(gameName, tagLine, region);
        
        if (!resultado.existe) {
            await message.reply('No se encontró la cuenta de prueba.');
            return;
        }
        
        const puuid = resultado.data.puuid;
        
        // Obtener datos del summoner
        const summoner = await obtenerSummoner(puuid, plataforma);
        
        if (!summoner) {
            await message.reply('Error al obtener información del summoner.');
            return;
        }
        
        // Obtener rangos
        const rangos = await obtenerRangos(puuid, plataforma);
        
        // Obtener campeones favoritos
        const campeonesFavoritos = await obtenerCampeonesFavoritos(puuid, plataforma);
        
        // Obtener últimas 3 partidas
        const ultimasPartidas = await obtenerUltimasPartidas(puuid, plataforma);
        
        // Preparar datos para el embed
        const datosJugador = {
            riotID: `${gameName}#${tagLine}`,
            region: region,
            iconoId: summoner.profileIconId,
            rangos: rangos,
            campeonesFavoritos: campeonesFavoritos,
            ultimasPartidas: ultimasPartidas
        };
        
        // Crear y enviar embed
        const embed = await crearEmbedPerfil(datosJugador);
        await message.channel.send({ 
            content: 'Revisé mis archivos mágicos con la información que me diste. <:AuroraTea:1465551396848930901>\nEncontré esta cuenta… ¿Es la que quieres registrar?\nConfirma con los botones de abajo o dime y empezamos otra vez.',
            embeds: [embed] 
        });
    } catch (error) {
        console.error('Error en test:', error);
        await message.reply('Error al generar el embed de prueba.');
    }
}

// Función para manejar los botones de confirmación
async function manejarBotonConfirmacion(interaction) {
    const userId = interaction.user.id;
    const estadoUsuario = usuariosEnRegistro.get(userId);
    
    console.log('User ID:', userId);
    console.log('Estado usuario:', estadoUsuario);
    console.log('Usuarios en registro:', usuariosEnRegistro);
    
    // Si el usuario no está en proceso de registro, ignorar
    if (!estadoUsuario) {
        await interaction.reply({ 
            content: 'No tienes un registro en proceso. Usa `Aurora!registro` para comenzar.',
            ephemeral: true 
        });
        return;
    }
    
    if (interaction.customId === 'confirmar_cuenta') {
        // Confirmar registro
        const riotID = estadoUsuario.riotID;
        const region = estadoUsuario.region;
        
        usuariosEnRegistro.delete(userId);
        
        // Deshabilitar botones (mantenerlos pero deshabilitados)
        const rowDisabled = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirmar_cuenta_disabled')
                    .setLabel('✓ Confirmar')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('reintentar_cuenta_disabled')
                    .setLabel('↻ Comenzar de nuevo')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
        
        await interaction.update({ 
            components: [rowDisabled]
        });
        
        // Enviar mensaje de confirmación en el canal
        await interaction.channel.send(mensajes.CompletoRegistro(riotID, region));
        
        // Aquí puedes agregar la lógica para guardar en base de datos
        
    } else if (interaction.customId === 'reintentar_cuenta') {
        // Reiniciar registro - volver a pedir Riot ID
        estadoUsuario.etapa = 'riotid';
        usuariosEnRegistro.set(userId, estadoUsuario);
        
        // Deshabilitar botones (el de reintentar en rojo, el otro en gris)
        const rowDisabled = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirmar_cuenta_disabled')
                    .setLabel('✓ Confirmar')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('reintentar_cuenta_disabled')
                    .setLabel('↻ Comenzar de nuevo')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
            );
        
        await interaction.update({ 
            components: [rowDisabled]
        });
        
        // Enviar mensaje para comenzar de nuevo
        await interaction.channel.send(mensajes.ComenzarDeNuevoRegistro);
    }
}

module.exports = { ejecutar, procesarRespuestaDM, testEmbed, manejarBotonConfirmacion };