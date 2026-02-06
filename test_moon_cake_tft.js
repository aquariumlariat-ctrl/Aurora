// test_tft_rank_by_riotid.js
require('dotenv').config();

const API_KEY = process.env.TFT_API_KEY;

if (!API_KEY) {
    console.error('❌ Falta TFT_API_KEY en el .env');
    process.exit(1);
}

async function riotFetch(url) {
    const res = await fetch(url, {
        headers: { "X-Riot-Token": API_KEY }
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} → ${text}`);
    }

    return res.json();
}

// 🔹 PASO 1 — RIOT ID → PUUID
async function getPUUID(gameName, tagLine) {
    const routingRegion = 'americas';

    const url = `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;

    console.log('\n📡 Obteniendo PUUID...');
    console.log('URL:', url);

    const data = await riotFetch(url);

    console.log('✅ Cuenta encontrada');
    console.log('PUUID:', data.puuid);

    return data.puuid;
}

// 🔹 PASO 2 — PUUID → RANGO TFT (ENDPOINT CORRECTO)
async function getTftRankByPUUID(puuid) {
    const region = 'la1';

    // ✅ ESTE ES EL ENDPOINT BUENO
    const url = `https://${region}.api.riotgames.com/tft/league/v1/by-puuid/${puuid}`;

    console.log('\n📡 Obteniendo rango TFT...');
    console.log('URL:', url);

    const data = await riotFetch(url);

    if (data.length === 0) {
        console.log('ℹ️ Tiene cuenta TFT pero nunca jugó ranked');
        return;
    }

    console.log('🏆 RANGOS TFT ENCONTRADOS:\n');

    for (const queue of data) {
        console.log(`Modo: ${queue.queueType}`);
        console.log(`Rango: ${queue.tier} ${queue.rank}`);
        console.log(`LP: ${queue.leaguePoints}`);
        console.log(`W/L: ${queue.wins}/${queue.losses}`);
        console.log('---------------------------');
    }
}

// 🚀 EJECUCIÓN
async function main() {
    const gameName = 'Moón Cake';
    const tagLine = '567';

    console.log('🧪 TEST TFT RANK BY RIOT ID');
    console.log(`Jugador: ${gameName}#${tagLine}`);
    console.log('='.repeat(50));

    try {
        const puuid = await getPUUID(gameName, tagLine);
        await getTftRankByPUUID(puuid);
    } catch (err) {
        console.error('❌ Error general:', err.message);
    }

    console.log('\n✅ Fin del test');
}

main();
