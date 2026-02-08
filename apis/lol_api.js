// registro/riotAPI.js
const { obtenerChampionPorId } = require('../utilidades/emotes');
require('dotenv').config();

// Mapeo de regiones a plataformas de Riot
const regionAPlatforma = {
    'LAN': 'la1',
    'LAS': 'la2',
    'NA': 'na1',
    'BR': 'br1'
};

// Mapeo de plataformas a routing
const plataformaARouting = {
    'la1': 'americas',
    'la2': 'americas',
    'na1': 'americas',
    'br1': 'americas'
};

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

// Función para verificar cuenta en Riot API
async function verificarCuentaRiot(gameName, tagLine, region) {
    const routing = 'americas';
    const url = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'X-Riot-Token': process.env.RIOT_API_KEY
            }
        });
        
        if (response.status === 200) {
            const data = await response.json();
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

// Función para obtener información del summoner (LoL)
async function obtenerSummoner(puuid, plataforma) {
    const url = `https://${plataforma}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'X-Riot-Token': process.env.RIOT_API_KEY
            }
        });
        
        if (response.status === 200) {
            const data = await response.json();
            console.log('Datos del summoner LoL completos:', data);
            return data;
        }
        return null;
    } catch (error) {
        console.error('Error al obtener summoner LoL:', error);
        return null;
    }
}

// Función para obtener Summoner de TFT (retorna el PUUID de TFT)
// IMPORTANTE: TFT tiene su propio PUUID separado del de LoL
async function obtenerSummonerTFT(puuid, plataforma) {
    const url = `https://${plataforma}.api.riotgames.com/tft/summoner/v1/summoners/by-puuid/${puuid}`;
    
    console.log('Obteniendo Summoner TFT - PUUID LoL:', puuid);
    console.log('Obteniendo Summoner TFT - Plataforma:', plataforma);
    console.log('Obteniendo Summoner TFT - URL:', url);
    
    try {
        const response = await fetch(url, {
            headers: {
                'X-Riot-Token': process.env.TFT_API_KEY || process.env.RIOT_API_KEY
            }
        });
        
        console.log('Status de respuesta Summoner TFT:', response.status);
        
        if (response.status === 200) {
            const data = await response.json();
            console.log('PUUID TFT obtenido:', data.puuid);
            return data; // Contiene data.puuid que es el PUUID de TFT
        }
        return null;
    } catch (error) {
        console.error('Error al obtener summoner TFT:', error);
        return null;
    }
}

// Función para obtener rangos del jugador (LoL)
async function obtenerRangos(puuid, plataforma) {
    const url = `https://${plataforma}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'X-Riot-Token': process.env.RIOT_API_KEY
            }
        });
        
        if (response.status === 200) {
            const data = await response.json();
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

// Función para obtener rango de TFT
// IMPORTANTE: Usa el PUUID de TFT (obtenido de obtenerSummonerTFT), no el PUUID de LoL
async function obtenerRangoTFT(puuidTFT, plataforma) {
    // ✅ ENDPOINT CORRECTO: /tft/league/v1/by-puuid/{puuid}
    const url = `https://${plataforma}.api.riotgames.com/tft/league/v1/by-puuid/${puuidTFT}`;
    
    console.log('Obteniendo rango TFT - PUUID TFT:', puuidTFT);
    console.log('Obteniendo rango TFT - Plataforma:', plataforma);
    console.log('Obteniendo rango TFT - URL:', url);
    
    try {
        const response = await fetch(url, {
            headers: {
                'X-Riot-Token': process.env.TFT_API_KEY || process.env.RIOT_API_KEY
            }
        });
        
        console.log('Status de respuesta TFT:', response.status);
        
        if (response.status === 200) {
            const data = await response.json();
            console.log('Datos TFT:', data);
            
            // El endpoint retorna un array con las colas de TFT
            if (data && data.length > 0) {
                // Buscar la cola RANKED (puede haber Double Up también)
                const rankedTFT = data.find(queue => 
                    queue.queueType === 'RANKED_TFT' || 
                    queue.queueType === 'RANKED_TFT_TURBO'
                ) || data[0]; // Fallback al primero si no encuentra
                
                console.log('Rango TFT encontrado:', rankedTFT);
                return {
                    tier: rankedTFT.tier,
                    rank: rankedTFT.rank,
                    lp: rankedTFT.leaguePoints
                };
            }
            
            console.log('Sin datos de TFT (array vacío - no ha jugado ranked)');
            return null;
        }
        
        console.log('Status code no 200, retornando null');
        return null;
    } catch (error) {
        console.error('Error al obtener rango TFT:', error);
        return null;
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

// Obtener top 2 roles principales con porcentajes basado en las últimas 20 partidas
async function obtenerRolesPrincipales(puuid, plataforma) {
    try {
        const routing = plataformaARouting[plataforma];
        
        // Obtener IDs de las últimas 20 partidas
        const matchListUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20`;
        const matchListResponse = await fetch(matchListUrl, {
            headers: {
                'X-Riot-Token': process.env.RIOT_API_KEY
            }
        });
        
        if (matchListResponse.status !== 200) {
            return null;
        }
        
        const matchList = await matchListResponse.json();
        
        // Contador de roles
        const rolesContador = {
            'TOP': 0,
            'JUNGLE': 0,
            'MIDDLE': 0,
            'BOTTOM': 0,
            'UTILITY': 0
        };
        
        // Colas permitidas (Ranked Solo, Ranked Flex, Normal Draft)
        const colasPermitidas = [420, 440, 400];
        
        let totalPartidas = 0;
        
        for (const matchId of matchList) {
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
                
                // Solo contar partidas ranked y draft
                if (!colasPermitidas.includes(queueId)) {
                    continue;
                }
                
                const participantData = matchData.info.participants.find(p => p.puuid === puuid);
                
                if (!participantData || !participantData.teamPosition) {
                    continue;
                }
                
                const role = participantData.teamPosition;
                
                if (rolesContador[role] !== undefined) {
                    rolesContador[role]++;
                    totalPartidas++;
                }
                
            } catch (error) {
                // Ignorar errores individuales de partidas
                continue;
            }
        }
        
        // Si no hay partidas válidas, retornar null
        if (totalPartidas === 0) {
            return null;
        }
        
        // Convertir a array y ordenar por cantidad (de mayor a menor)
        const rolesOrdenados = Object.entries(rolesContador)
            .filter(([_, cantidad]) => cantidad > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2) // Top 2 roles
            .map(([rol, cantidad]) => ({
                rol: rol,
                cantidad: cantidad,
                porcentaje: Math.round((cantidad / totalPartidas) * 100)
            }));
        
        return rolesOrdenados;
        
    } catch (error) {
        console.error('Error al obtener roles principales:', error);
        return null;
    }
}

// Mantener función legacy para compatibilidad (ahora devuelve solo el top 1)
async function obtenerRolPrincipal(puuid, plataforma) {
    const roles = await obtenerRolesPrincipales(puuid, plataforma);
    if (!roles || roles.length === 0) return null;
    return roles[0].rol;
}

module.exports = {
    regionAPlatforma,
    verificarCuentaRiot,
    obtenerSummoner,
    obtenerSummonerTFT,
    obtenerRangos,
    obtenerRangoTFT,
    obtenerCampeonesFavoritos,
    obtenerUltimasPartidas,
    obtenerRolesPrincipales,
    obtenerRolPrincipal
};
/**
 * Obtiene el Riot ID actual desde un PUUID (por si cambió el nombre)
 * @param {string} puuid - PUUID de la cuenta Riot
 * @returns {Promise<Object|null>} - { riotID, gameName, tagLine } o null
 */
async function obtenerRiotIDActual(puuid) {
    try {
        const routingRegion = 'americas';
        const url = `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`;
        
        const response = await fetch(url, {
            headers: {
                'X-Riot-Token': process.env.RIOT_API_KEY
            }
        });
        
        if (response.status === 200) {
            const data = await response.json();
            return {
                riotID: `${data.gameName}#${data.tagLine}`,
                gameName: data.gameName,
                tagLine: data.tagLine
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error al obtener Riot ID actual:', error);
        return null;
    }
}

/**
 * Obtiene todos los datos de Riot API necesarios para perfil
 * Agrupa llamadas en paralelo para optimizar velocidad
 * @param {string} puuid - PUUID de la cuenta
 * @param {string} plataforma - Plataforma regional (la1, la2, etc)
 * @param {string} gameName - Nombre del jugador (para TFT)
 * @param {string} tagLine - Tag del jugador (para TFT)
 * @returns {Promise<Object|null>} - Datos completos o null
 */
async function obtenerDatosRiot(puuid, plataforma, gameName, tagLine) {
    try {
        // Import TFT dentro de la función para evitar dependencia circular
        const { obtenerRangoTFT } = require('./tft_api');
        
        // Obtener summoner (necesario para iconId)
        const summoner = await obtenerSummoner(puuid, plataforma);
        
        if (!summoner) {
            return null;
        }
        
        // Hacer llamadas en paralelo para optimizar
        const [rangos, rangoTFT, campeonesFavoritos, ultimasPartidas, rolesPrincipales] = await Promise.all([
            obtenerRangos(puuid, plataforma),
            obtenerRangoTFT(gameName, tagLine, plataforma),
            obtenerCampeonesFavoritos(puuid, plataforma),
            obtenerUltimasPartidas(puuid, plataforma),
            obtenerRolesPrincipales(puuid, plataforma)
        ]);
        
        return {
            summoner,
            rangos: {
                soloq: rangos.soloq,
                flex: rangos.flex,
                tft: rangoTFT
            },
            campeonesFavoritos,
            ultimasPartidas,
            rolesPrincipales
        };
    } catch (error) {
        console.error('Error al obtener datos de Riot:', error);
        return null;
    }
}

// Agregar al export
module.exports.obtenerRiotIDActual = obtenerRiotIDActual;
module.exports.obtenerDatosRiot = obtenerDatosRiot;