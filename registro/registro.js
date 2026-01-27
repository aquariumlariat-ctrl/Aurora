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
    const routing = 'americas';
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
            console.log('Datos de rangos:', data);
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
};

// Función para obtener las últimas 3 partidas
async function obtenerUltimasPartidas(puuid, plataforma) {
    const routing = 'americas';
    const colasPermitidas = [400, 420, 430, 440, 450, 700];
    
    try {
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
        
        const partidasFiltradas = [];
        
        for (const matchId of matchList) {
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
                
                if (!colasPermitidas.includes(queueId)) {
                    continue;
                }
                
                const participantData = matchData.info.participants.find(p => p.puuid === puuid);
                
                if (!participantData) {
                    continue;
                }
                
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
    const esEnDM = message.channel.isDMBased();
    console.log('Ejecutando registro, es en DM:', esEnDM);
    
    try {
        const dmChannel = esEnDM ? message.channel : await message.author.createDM();
        console.log('Canal DM obtenido');
        
        // Buscar mensajes previos del bot en el DM
        const mensajesPrevios = await dmChannel.messages.fetch({ limit: 50 });
        console.log('Mensajes previos obtenidos:', mensajesPrevios.size);
        
        const mensajesRegistro = mensajesPrevios.filter(msg => 
            msg.author.id === message.client.user.id && 
            (msg.content.includes('Bienvenido al proceso de registro') ||
            msg.content.includes('Empecemos con el registro de tu cuenta de League of Legends.'))
        );
        
        for (const [, msgBot] of mensajesRegistro) {
            const mensajesDespues = mensajesPrevios.filter(msg => 
                msg.author.id === message.author.id && 
                msg.createdTimestamp > msgBot.createdTimestamp
            );
            
            if (mensajesDespues.size === 0) {
                await msgBot.delete().catch(() => {});
            }
        }
        
        const tiempoInicio = Date.now();
        usuariosEnRegistro.set(message.author.id, { 
            etapa: 'riotid',
            tiempoInicio: tiempoInicio
        });
        console.log('Usuario agregado al registro');
        
        setTimeout(async () => {
            const estadoActual = usuariosEnRegistro.get(message.author.id);
            if (estadoActual && estadoActual.tiempoInicio === tiempoInicio) {
                usuariosEnRegistro.delete(message.author.id);
                try {
                    await message.author.send(mensajes.TimeOutRegistro());
                } catch (error) {
                    // Ignorar si no se puede enviar DM
                }
            }
        }, 60 * 60 * 1000);
        
        console.log('Enviando mensaje de bienvenida');
        await message.author.send(mensajes.ArranqueRegistro);
        console.log('Mensaje de bienvenida enviado');
        
        // Solo responder en el canal si NO es un DM
        if (!esEnDM) {
            console.log('Respondiendo en el canal');
            await message.reply(mensajes.LlamadoRegistro(message.author));
        } else {
            console.log('Es DM, no se responde en canal');
        }
    } catch (error) {
        console.error('Error en ejecutar:', error);
        // Solo intentar responder si no es un DM
        if (!esEnDM) {
            await message.reply(mensajes.FalloLlamadoRegistro(message.author));
        }
    }
}

async function procesarRespuestaDM(message) {
    const userId = message.author.id;
    const estadoUsuario = usuariosEnRegistro.get(userId);
    
    if (!estadoUsuario) return;
    
    if (message.content === 'Aurora!RTO') {
        usuariosEnRegistro.delete(userId);
        await message.reply(mensajes.TimeOutRegistro());
        return;
    }
    
    if (message.content.toLowerCase() === 'aurora!cancelar') {
        usuariosEnRegistro.delete(userId);
        await message.reply(mensajes.FinRegistro());
        return;
    }
    
    if (estadoUsuario.etapa === 'riotid') {
        await validarRiotID(message, estadoUsuario);
    } else if (estadoUsuario.etapa === 'region') {
        await validarRegion(message, estadoUsuario);
    }
}

async function validarRiotID(message, estadoUsuario) {
    const riotID = message.content.trim();
    
    if (!riotID.includes('#')) {
        await message.reply(mensajes.TAGIncorrectoRegistro);
        return;
    }
    
    const [nombre, tag] = riotID.split('#');
    
    if (!nombre || !tag) {
        await message.reply(mensajes.IDIncorrectoRegistro);
        return;
    }
    
    estadoUsuario.riotID = riotID;
    estadoUsuario.etapa = 'region';
    usuariosEnRegistro.set(message.author.id, estadoUsuario);
    
    await message.reply(mensajes.RegionRegistro(riotID));
}

async function validarRegion(message, estadoUsuario) {
    const region = message.content.trim().toUpperCase();
    const regionesValidas = ['LAN', 'LAS', 'NA', 'BR'];
    
    if (!regionesValidas.includes(region)) {
        await message.reply(mensajes.RegionInvalidaRegistro);
        return;
    }
    
    estadoUsuario.region = region;
    
    const [gameName, tagLine] = estadoUsuario.riotID.split('#');
    const resultado = await verificarCuentaRiot(gameName, tagLine, region);
    
    if (resultado.existe) {
        const plataforma = regionAPlatforma[region];
        const puuid = resultado.data.puuid;
        
        const summoner = await obtenerSummoner(puuid, plataforma);
        
        if (!summoner) {
            await message.reply('Error al obtener información del summoner.');
            return;
        }
        
        const rangos = await obtenerRangos(puuid, plataforma);
        const campeonesFavoritos = await obtenerCampeonesFavoritos(puuid, plataforma);
        const ultimasPartidas = await obtenerUltimasPartidas(puuid, plataforma);
        
        estadoUsuario.etapa = 'confirmacion';
        estadoUsuario.riotID = `${resultado.data.gameName}#${resultado.data.tagLine}`;
        estadoUsuario.region = region;
        estadoUsuario.puuid = puuid;
        usuariosEnRegistro.set(message.author.id, estadoUsuario);
        
        const datosJugador = {
            riotID: `${resultado.data.gameName}#${resultado.data.tagLine}`,
            region: region,
            iconoId: summoner.profileIconId,
            rangos: rangos,
            campeonesFavoritos: campeonesFavoritos,
            ultimasPartidas: ultimasPartidas
        };
        
        const embed = await crearEmbedPerfil(datosJugador);
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirmar_cuenta')
                    .setLabel('Registrar Cuenta')
                    .setEmoji('1465263781348118564')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('reintentar_cuenta')
                    .setLabel('Volver a Comenzar')
                    .setEmoji('1465219188561023124')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        await message.reply({ 
            content: 'Revisé mis archivos mágicos con la información que me diste. <:AuroraTea:1465551396848930901>\nEncontré esta cuenta… ¿Es la que quieres registrar?\nConfirma con los botones de abajo o dime y empezamos otra vez.',
            embeds: [embed],
            components: [row]
        });
    } else {
        estadoUsuario.etapa = 'riotid';
        usuariosEnRegistro.set(message.author.id, estadoUsuario);
        await message.reply(mensajes.CuentaNoEncontradaRegistro);
    }
}

async function testEmbed(message) {
    const gameName = 'cachorracachonda';
    const tagLine = 'juzo';
    const region = 'LAN';
    const plataforma = regionAPlatforma[region];
    
    await message.reply('Generando embed de prueba...');
    
    try {
        const resultado = await verificarCuentaRiot(gameName, tagLine, region);
        
        if (!resultado.existe) {
            await message.reply('No se encontró la cuenta de prueba.');
            return;
        }
        
        const puuid = resultado.data.puuid;
        const summoner = await obtenerSummoner(puuid, plataforma);
        
        if (!summoner) {
            await message.reply('Error al obtener información del summoner.');
            return;
        }
        
        const rangos = {
            soloq: {
                tier: 'CHALLENGER',
                rank: 'I',
                lp: 1000
            },
            flex: {
                tier: 'DIAMOND',
                rank: 'III',
                lp: 45
            },
            tft: null
        };
        
        const campeonesFavoritos = await obtenerCampeonesFavoritos(puuid, plataforma);
        const ultimasPartidas = await obtenerUltimasPartidas(puuid, plataforma);
        
        const datosJugador = {
            riotID: `${gameName}#${tagLine}`,
            region: region,
            iconoId: summoner.profileIconId,
            rangos: rangos,
            campeonesFavoritos: campeonesFavoritos,
            ultimasPartidas: ultimasPartidas
        };
        
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

async function manejarBotonConfirmacion(interaction) {
    const userId = interaction.user.id;
    const estadoUsuario = usuariosEnRegistro.get(userId);
    
    console.log('User ID:', userId);
    console.log('Estado usuario:', estadoUsuario);
    console.log('Usuarios en registro:', usuariosEnRegistro);
    
    if (!estadoUsuario) {
        await interaction.reply({ 
            content: 'No tienes un registro en proceso. Usa `Aurora!registro` para comenzar.',
            ephemeral: true 
        });
        return;
    }
    
    if (interaction.customId === 'confirmar_cuenta') {
        const riotID = estadoUsuario.riotID;
        const region = estadoUsuario.region;
        
        usuariosEnRegistro.delete(userId);
        
        const rowDisabled = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirmar_cuenta_disabled')
                    .setLabel('Registrar Cuenta')
                    .setEmoji('1465263781348118564')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('reintentar_cuenta_disabled')
                    .setLabel('Volver a Comenzar')
                    .setEmoji('1465219188561023124')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
        
        await interaction.update({ 
            components: [rowDisabled]
        });
        
        await interaction.channel.send(mensajes.CompletoRegistro(riotID, region));
        
    } else if (interaction.customId === 'reintentar_cuenta') {
        estadoUsuario.etapa = 'riotid';
        usuariosEnRegistro.set(userId, estadoUsuario);
        
        const rowDisabled = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirmar_cuenta_disabled')
                    .setLabel('Registrar Cuenta')
                    .setEmoji('1465263781348118564')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('reintentar_cuenta_disabled')
                    .setLabel('Volver a Comenzar')
                    .setEmoji('1465219188561023124')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
            );
        
        await interaction.update({ 
            components: [rowDisabled]
        });
        
        await interaction.channel.send(mensajes.ComenzarDeNuevoRegistro);
    }
}

module.exports = { ejecutar, procesarRespuestaDM, testEmbed, manejarBotonConfirmacion };