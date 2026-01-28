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

// Función para obtener Summoner ID de TFT (necesario para obtener rango TFT)
async function obtenerSummonerTFT(puuid, plataforma) {
    const url = `https://${plataforma}.api.riotgames.com/tft/summoner/v1/summoners/by-puuid/${puuid}`;
    
    console.log('Obteniendo Summoner TFT - PUUID:', puuid);
    console.log('Obteniendo Summoner TFT - Plataforma:', plataforma);
    console.log('Obteniendo Summoner TFT - URL:', url);
    
    try {
        const response = await fetch(url, {
            headers: {
                'X-Riot-Token': process.env.RIOT_API_KEY
            }
        });
        
        console.log('Status de respuesta Summoner TFT:', response.status);
        
        if (response.status === 200) {
            const data = await response.json();
            console.log('Datos del summoner TFT completos:', data);
            return data;
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
async function obtenerRangoTFT(summonerId, plataforma) {
    const url = `https://${plataforma}.api.riotgames.com/tft/league/v1/entries/by-summoner/${summonerId}`;
    
    console.log('Obteniendo rango TFT - Summoner ID:', summonerId);
    console.log('Obteniendo rango TFT - Plataforma:', plataforma);
    console.log('Obteniendo rango TFT - URL:', url);
    
    try {
        const response = await fetch(url, {
            headers: {
                'X-Riot-Token': process.env.RIOT_API_KEY
            }
        });
        
        console.log('Status de respuesta TFT:', response.status);
        
        if (response.status === 200) {
            const data = await response.json();
            console.log('Datos TFT:', data);
            
            // TFT solo tiene un tipo de ranked
            if (data && data.length > 0) {
                const tftData = data[0];
                console.log('Rango TFT encontrado:', tftData);
                return {
                    tier: tftData.tier,
                    rank: tftData.rank,
                    lp: tftData.leaguePoints
                };
            }
            
            console.log('Sin datos de TFT (array vacío)');
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

module.exports = {
    regionAPlatforma,
    verificarCuentaRiot,
    obtenerSummoner,
    obtenerSummonerTFT,
    obtenerRangos,
    obtenerRangoTFT,
    obtenerCampeonesFavoritos,
    obtenerUltimasPartidas
};