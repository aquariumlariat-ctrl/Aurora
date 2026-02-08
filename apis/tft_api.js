// tft_elo.js
require('dotenv').config();

const TFT_API_KEY = process.env.TFT_API_KEY || process.env.RIOT_API_KEY;

async function riotFetch(url) {
    const res = await fetch(url, {
        headers: { "X-Riot-Token": TFT_API_KEY }
    });

    if (!res.ok) {
        const text = await res.text();
        console.error(`Error en fetch: ${res.status} → ${text}`);
        return null;
    }

    return res.json();
}

// 🔹 RIOT ID → PUUID DE CUENTA
async function getPUUIDFromRiotID(gameName, tagLine) {
    const routingRegion = 'americas';
    const url = `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;

    console.log('\n📡 Obteniendo PUUID de cuenta desde Riot ID...');
    console.log('Riot ID:', `${gameName}#${tagLine}`);
    console.log('URL:', url);

    const data = await riotFetch(url);
    
    if (!data) {
        console.log('❌ No se pudo obtener PUUID de cuenta');
        return null;
    }

    console.log('✅ PUUID de cuenta obtenido:', data.puuid);
    return data.puuid;
}

// 🔹 PUUID → RANGO TFT
async function getTftRankByPUUID(puuid, plataforma) {
    const url = `https://${plataforma}.api.riotgames.com/tft/league/v1/by-puuid/${puuid}`;

    console.log('\n📡 Obteniendo rango TFT...');
    console.log('URL:', url);

    const data = await riotFetch(url);
    
    if (!data) {
        console.log('ℹ️ Sin datos de TFT');
        return null;
    }

    if (data.length === 0) {
        console.log('ℹ️ Tiene cuenta TFT pero nunca jugó ranked');
        return null;
    }

    console.log('🏆 RANGOS TFT ENCONTRADOS:\n');

    const rankedTFT = data.find(queue => queue.queueType === 'RANKED_TFT');
    
    if (!rankedTFT) {
        console.log('ℹ️ No tiene rango en RANKED_TFT (solo Double Up u otros modos)');
        return null;
    }

    console.log(`Modo: ${rankedTFT.queueType}`);
    console.log(`Rango: ${rankedTFT.tier} ${rankedTFT.rank}`);
    console.log(`LP: ${rankedTFT.leaguePoints}`);
    console.log(`W/L: ${rankedTFT.wins}/${rankedTFT.losses}`);
    console.log('---------------------------');
    
    return {
        tier: rankedTFT.tier,
        rank: rankedTFT.rank,
        lp: rankedTFT.leaguePoints
    };
}

// ✅ FUNCIÓN PRINCIPAL: Recibe Riot ID (gameName, tagLine)
async function obtenerRangoTFT(gameName, tagLine, plataforma = 'la1') {
    console.log('🎮 OBTENIENDO RANGO TFT');
    console.log(`Jugador: ${gameName}#${tagLine}`);
    console.log('='.repeat(50));

    try {
        // Paso 1: Riot ID → PUUID de cuenta
        const puuid = await getPUUIDFromRiotID(gameName, tagLine);
        if (!puuid) {
            return null;
        }

        // Paso 2: PUUID → Rango TFT
        const rangoTFT = await getTftRankByPUUID(puuid, plataforma);
        
        console.log('\n✅ Fin');
        return rangoTFT;
    } catch (err) {
        console.error('❌ Error general:', err.message);
        return null;
    }
}

// 🧪 TEST DIRECTO
if (require.main === module) {
    const gameName = 'Moón Cake';
    const tagLine = '567';
    
    obtenerRangoTFT(gameName, tagLine, 'la1');
}

module.exports = {
    obtenerRangoTFT
};