// utilidades/emblemas.js

// Emojis de rangos base
const rankEmojis = {
    'UNRANKED': '<:SinRango:1465508962341490861>',
    'IRON': '<:Hierro:1465486905566171239>',
    'BRONZE': '<:Bronce:1465483354932514968>',
    'SILVER': '<:Plata:1465495513955827817>',
    'GOLD': '<:Oro:1465498286613069844>',
    'PLATINUM': '<:Platino:1465500320200261653>',
    'EMERALD': '<:Esmeralda:1465502592464322725>',
    'DIAMOND': '<:Diamante:1465505383333236768>',
    'MASTER': '<:Maestro:1465506538356478147>',
    'GRANDMASTER': '<:GranMaestro:1465507402081374376>',
    'CHALLENGER': '<:Retador:1465508045575426078>'
};

// Emojis de rangos con división
const rankDivisionEmojis = {
    // Hierro
    'IRON_I': '<:I_Hierro:1465488019212468418>',
    'IRON_II': '<:II_Hierro:1465491872502775963>',
    'IRON_III': '<:III_Hierro:1465490596318810256>',
    'IRON_IV': '<:IV_Hierro:1465492094134124660>',
    
    // Bronce
    'BRONZE_I': '<:I_Bronce:1465494074797723773>',
    'BRONZE_II': '<:II_Bronce:1465494048793166025>',
    'BRONZE_III': '<:III_Bronce:1465494026290729065>',
    'BRONZE_IV': '<:IV_Bronce:1465494001565044900>',
    
    // Plata
    'SILVER_I': '<:I_Plata:1465497061750345830>',
    'SILVER_II': '<:II_Plata:1465497088354681059>',
    'SILVER_III': '<:III_Plata:1465497114082672771>',
    'SILVER_IV': '<:IV_Plata:1465497148480159826>',
    
    // Oro
    'GOLD_I': '<:I_Oro:1465498926135382178>',
    'GOLD_II': '<:II_Oro:1465498949832933467>',
    'GOLD_III': '<:III_Oro:1465498975871434895>',
    'GOLD_IV': '<:IV_Oro:1465498999623651511>',
    
    // Platino
    'PLATINUM_I': '<:I_Platino:1465501005499338805>',
    'PLATINUM_II': '<:II_Platino:1465501030006521866>',
    'PLATINUM_III': '<:III_Platino:1465501052508967138>',
    'PLATINUM_IV': '<:IV_Platino:1465501082510950531>',
    
    // Esmeralda
    'EMERALD_I': '<:I_Esmeralda:1465504001104674930>',
    'EMERALD_II': '<:II_Esmeralda:1465503980141416531>',
    'EMERALD_III': '<:III_Esmeralda:1465503956376490129>',
    'EMERALD_IV': '<:IV_Esmeralda:1465503936235573371>',
    
    // Diamante
    'DIAMOND_I': '<:I_Diamante:1465505286021320781>',
    'DIAMOND_II': '<:II_Diamante:1465505312940490853>',
    'DIAMOND_III': '<:III_Diamante:1465505336885772403>',
    'DIAMOND_IV': '<:IV_Diamante:1465505358050234533>'
};

// Función para obtener emojis de un rango
function obtenerEmojisRango(tier, rank) {
    const tierEmoji = rankEmojis[tier] || rankEmojis['UNRANKED'];
    
    // Master, Grandmaster y Challenger no tienen divisiones
    if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier)) {
        return {
            tierEmoji,
            divisionEmoji: null,
            combined: tierEmoji
        };
    }
    
    // Construir la key para buscar el emoji de división
    const divisionKey = `${tier}_${rank}`;
    const divisionEmoji = rankDivisionEmojis[divisionKey];
    
    return {
        tierEmoji,
        divisionEmoji,
        combined: divisionEmoji ? `${tierEmoji} ${divisionEmoji}` : tierEmoji
    };
}

module.exports = {
    rankEmojis,
    rankDivisionEmojis,
    obtenerEmojisRango
};