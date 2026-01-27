// utilidades/emotes.js

// Mapeo de campeones a sus emojis de Discord
const championEmojis = {
    'Aatrox': '<:Aatrox:1465287757671694348>',
    'Ahri': '<:Ahri:1465288578085949683>',
    'Akali': '<:Akali:1465289180480405688>',
    'Akshan': '<:Akshan:1465289207089201162>',
    'Alistar': '<:Alistar:1465289679866953780>',
    'Ambessa': '<:Ambessa:1465289235576913931>',
    'Amumu': '<:Amumu:1465289262823112817>',
    'Anivia': '<:Anivia:1465289289884504138>',
    'Annie': '<:Annie:1465288600433197244>',
    'Aphelios': '<:Aphelios:1465289316690301065>',
    'Ashe': '<:Ashe:1465289340170141822>',
    'AurelionSol': '<:AurelionSol:1465289829620387985>',
    'Aurora': '<:Aurora:1465289864173060292>',
    'Azir': '<:Azir:1465289896326467616>',
    'Bard': '<:Bardo:1465289950189846665>',
    'Belveth': '<:BelVeth:1465289973178826773>',
    'Blitzcrank': '<:Blitzcrank:1465289996498898975>',
    'Brand': '<:Brand:1465290016392741030>',
    'Braum': '<:Braum:1465290041936052315>',
    'Briar': '<:Briar:1465290062060060745>',
    'Caitlyn': '<:Caitlyn:1465290526394945577>',
    'Camille': '<:Camille:1465290570149924978>',
    'Cassiopeia': '<:Cassiopeia:1465291427100495892>',
    'Chogath': '<:ChoGath:1465290599581089898>',
    'Corki': '<:Corki:1465290626567245980>',
    'Darius': '<:Darius:1465290660059025502>',
    'Diana': '<:Diana:1465290755873443971>',
    'DrMundo': '<:DrMundo:1465290793051881584>',
    'Draven': '<:Draven:1465291479202398241>',
    'Ekko': '<:Ekko:1465290720809058335>',
    'Elise': '<:Elise:1465291690280488971>',
    'Evelynn': '<:Evelynn:1465291722010656794>',
    'Ezreal': '<:Ezreal:1465291742013292658>',
    'Fiddlesticks': '<:Fiddlesticks:1465291762498277406>',
    'Fiora': '<:Fiora:1465291783490506764>',
    'Fizz': '<:Fizz:1465291827262263306>',
    'Galio': '<:Galio:1465291806601121874>',
    'Gangplank': '<:Gangplank:1465291854202409081>',
    'Garen': '<:Garen:1465291883352821781>',
    'Gnar': '<:Gnar:1465291903447863488>',
    'Gragas': '<:Gragas:1465292605741994066>',
    'Graves': '<:Graves:1465292629997780992>',
    'Gwen': '<:Gwen:1465292665288528005>',
    'Hecarim': '<:Hecarim:1465292688260862045>',
    'Heimerdinger': '<:Heimerdinger:1465297945284055052>',
    'Hwei': '<:Hwei:1465297946953383989>',
    'Illaoi': '<:Illaoi:1465297948437909670>',
    'Irelia': '<:Irelia:1465299012373708871>',
    'Ivern': '<:Ivern:1465299043629535254>',
    'Janna': '<:Janna:1465297954326843495>',
    'JarvanIV': '<:JarvanIV:1465295634796908646>',
    'Jax': '<:Jax:1465295791462551777>',
    'Jayce': '<:Jayce:1465295689671245857>',
    'Jhin': '<:Jhin:1465295823029141645>',
    'Jinx': '<:Jinx:1465295849801121878>',
    'Ksante': '<:KSante:1465296208888201321>',
    'Kaisa': '<:KaiSa:1465295887352856795>',
    'Kalista': '<:Kalista:1465295912162033737>',
    'Karma': '<:Karma:1465295939143991513>',
    'Karthus': '<:Karthus:1465295962506526792>',
    'Kassadin': '<:Kassadin:1465295989668581417>',
    'Katarina': '<:Katarina:1465296012942901348>',
    'Kayle': '<:Kayle:1465296037705945323>',
    'Kayn': '<:Kayn:1465296233466953913>',
    'Kennen': '<:Kennen:1465296259727233044>',
    'Khazix': '<:KhaZix:1465296810129227902>',
    'Kindred': '<:Kindred:1465296287359303791>',
    'Kled': '<:Kled:1465296312206364918>',
    'KogMaw': '<:KogMaw:1465296337892544597>',
    'Leblanc': '<:LeBlanc:1465296373388804132>',
    'LeeSin': '<:LeeSin:1465296397388480659>',
    'Leona': '<:Leona:1465296624216707113>',
    'Lillia': '<:Lillia:1465296431349760113>',
    'Lissandra': '<:Lissandra:1465297039775629402>',
    'Lucian': '<:Lucian:1465296748925816894>',
    'Lulu': '<:Lulu:1465297005298450599>',
    'Lux': '<:Lux:1465297284861268139>',
    'Malphite': '<:Malphite:1465296849010163764>',
    'Malzahar': '<:Malzahar:1465297414029316172>',
    'Maokai': '<:Maokai:1465297452004409396>',
    'MasterYi': '<:MaestroYi:1465296717833310281>',
    'Mel': '<:Mel:1465297321787920414>',
    'Milio': '<:Milio:1465297350540001321>',
    'MissFortune': '<:MissFortune:1465298233583730742>',
    'Mordekaiser': '<:Mordekaiser:1465298114117238836>',
    'Morgana': '<:Morgana:1465298010635370511>',
    'Naafiri': '<:Naafiri:1465310735923019881>',
    'Nami': '<:Nami:1465297915852357743>',
    'Nasus': '<:Nasus:1465297871208321128>',
    'Nautilus': '<:Nautilus:1465297824395821225>',
    'Neeko': '<:Neeko:1465297150299869227>',
    'Nidalee': '<:Nidalee:1465297979442466940>',
    'Nilah': '<:Nilah:1465297500566065184>',
    'Nocturne': '<:Nocturne:1465297549803126946>',
    'Nunu': '<:NunuYWillump:1465297630023254140>',
    'Olaf': '<:Olaf:1465297668547936351>',
    'Orianna': '<:Orianna:1465297699044589763>',
    'Ornn': '<:Ornn:1465297739461165137>',
    'Pantheon': '<:Pantheon:1465297129122566144>',
    'Poppy': '<:Poppy:1465297101402407014>',
    'Pyke': '<:Pyke:1465300896383635680>',
    'Qiyana': '<:Qiyana:1465300917493436533>',
    'Quinn': '<:Quinn:1465300938335060130>',
    'Rakan': '<:Rakan:1465300960153829439>',
    'Rammus': '<:Rammus:1465301046824800298>',
    'RekSai': '<:RekSai:1465301070984122410>',
    'Rell': '<:Rell:1465301121936527360>',
    'Renata': '<:RenataGlasc:1465301151175016492>',
    'Renekton': '<:Renekton:1465301177716707442>',
    'Rengar': '<:Rengar:1465301199975612652>',
    'Riven': '<:Riven:1465301257802617038>',
    'Rumble': '<:Rumble:1465301282230374431>',
    'Ryze': '<:Ryze:1465301306804535389>',
    'Samira': '<:Samira:1465301329126887444>',
    'Sejuani': '<:Sejuani:1465301355852726302>',
    'Senna': '<:Senna:1465301380700049452>',
    'Seraphine': '<:Seraphine:1465301403714195456>',
    'Sett': '<:Sett:1465301434663833634>',
    'Shaco': '<:Shaco:1465301468730097771>',
    'Shen': '<:Shen:1465301499717484598>',
    'Shyvana': '<:Shyvana:1465301603933225022>',
    'Singed': '<:Singed:1465301627086049280>',
    'Sion': '<:Sion:1465301663404392499>',
    'Sivir': '<:Sivir:1465301688960286804>',
    'Skarner': '<:Skarner:1465301713278861526>',
    'Smolder': '<:Smolder:1465301737333325864>',
    'Sona': '<:Sona:1465301762654081167>',
    'Soraka': '<:Soraka:1465301785882398905>',
    'Swain': '<:Swain:1465301808477110326>',
    'Sylas': '<:Sylas:1465301834347450581>',
    'Syndra': '<:Syndra:1465301929990160476>',
    'TahmKench': '<:TahmKench:1465301956296835184>',
    'Taliyah': '<:Taliyah:1465301983106830346>',
    'Talon': '<:Talon:1465302011871232032>',
    'Taric': '<:Taric:1465302495344595106>',
    'Teemo': '<:Teemo:1465302032507338857>',
    'Thresh': '<:Thresh:1465302250304966808>',
    'Tristana': '<:Tristana:1465302082457305108>',
    'Trundle': '<:Trundle:1465302109019836530>',
    'Tryndamere': '<:Tryndamere:1465302155484463114>',
    'TwistedFate': '<:TwistedFate:1465302132478574634>',
    'Twitch': '<:Twitch:1465302530174091418>',
    'Udyr': '<:Udyr:1465302557034283056>',
    'Urgot': '<:Urgot:1465302586012864721>',
    'Varus': '<:Varus:1465302609001971884>',
    'Vayne': '<:Vayne:1465302643550326864>',
    'Veigar': '<:Veigar:1465302668984455271>',
    'Velkoz': '<:VelKoz:1465302720994086973>',
    'Vex': '<:Vex:1465302745237164114>',
    'Vi': '<:Vi:1465315999359172649>',
    'Viego': '<:Viego:1465465522048205129>',
    'Viktor': '<:Viktor:1465465545280323718>',
    'Vladimir': '<:Vladimir:1465465572413145294>',
    'Volibear': '<:Volibear:1465465597533098118>',
    'Warwick': '<:Warwick:1465465654437220402>',
    'MonkeyKing': '<:Wukong:1465465694765187308>',
    'Xayah': '<:Xayah:1465465754962104360>',
    'Xerath': '<:Xerath:1465465807315140722>',
    'XinZhao': '<:XinZhao:1465465847974858837>',
    'Yasuo': '<:Yasuo:1465465877607743560>',
    'Yone': '<:Yone:1465465999888351416>',
    'Yorick': '<:Yorick:1465465948575367439>',
    'Yuumi': '<:Yuumi:1465465926311743529>',
    'Zac': '<:Zac:1465465903473885255>',
    'Zed': '<:Zed:1465466071908745279>',
    'Zeri': '<:Zeri:1465466205488807956>',
    'Ziggs': '<:Ziggs:1465466231279583425>',
    'Zilean': '<:Zilean:1465466258148298832>',
    'Zoe': '<:Zoe:1465466095543783640>',
    'Zyra': '<:Zyra:1465465729561268417>'
};

// Cache para el mapeo de championId a nombre
let championIdMap = null;

// Función para obtener el mapeo de championId a nombre desde Data Dragon
async function obtenerMapeoChampions() {
    if (championIdMap) {
        return championIdMap;
    }

    try {
        // Obtener la última versión
        const versionResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await versionResponse.json();
        const latestVersion = versions[0];

        // Obtener datos de campeones
        const championResponse = await fetch(
            `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`
        );
        const championData = await championResponse.json();

        // Crear mapeo de ID a nombre (key es el ID numérico, valor es el nombre interno sin formato)
        championIdMap = {};
        for (const champKey in championData.data) {
            const champ = championData.data[champKey];
            championIdMap[champ.key] = {
                id: champ.id,      // Nombre interno sin formato (ej: "Kaisa")
                name: champ.name   // Nombre real con formato (ej: "Kai'Sa")
            };
        }

        return championIdMap;
    } catch (error) {
        console.error('Error al obtener mapeo de campeones:', error);
        return {};
    }
}

// Función para obtener el nombre y emoji de un campeón por su ID
async function obtenerChampionPorId(championId) {
    const mapeo = await obtenerMapeoChampions();
    const championData = mapeo[championId];

    if (!championData) {
        return {
            name: `Champion ${championId}`,
            emoji: '❓'
        };
    }

    // Usar el id interno (sin formato) para buscar el emoji
    const emoji = championEmojis[championData.id] || '❓';

    return {
        name: championData.name,  // Nombre con formato correcto (ej: "Kai'Sa")
        emoji: emoji
    };
}

module.exports = { 
    obtenerChampionPorId,
    championEmojis 
};