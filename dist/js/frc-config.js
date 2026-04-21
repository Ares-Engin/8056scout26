/* ============================================================
   TBA API CONFIGURATION
   ============================================================ */

const DEFAULT_EVENTS = [
    { key: "2026cnsh", name: "Shanghai Regional 2026", season: 2026, league: 'frc' },
    { key: "2026flor", name: "Orlando Regional 2026", season: 2026, league: 'frc' },
    { key: "2026tuis", name: "Istanbul Regional 2026", season: 2026, league: 'frc' },
    { key: "2026tuis2", name: "Bosphorus Regional 2026", season: 2026, league: 'frc' },
    { key: "2026tuis3", name: "Marmara Regional 2026", season: 2026, league: 'frc' },
    { key: "2026tuis4", name: "Yeditepe Regional 2026", season: 2026, league: 'frc' },
    { key: "2026tuis5", name: "Avrasya Regional 2026", season: 2026, league: 'frc' },
    { key: "2026tuhc", name: "Haliç Regional 2026", season: 2026, league: 'frc' },
    { key: "2026tuak2", name: "Başkent Regional 2026", season: 2026, league: 'frc' },
    { key: "2026tuak", name: "Ankara Regional 2026", season: 2026, league: 'frc' },
    { key: "2025tuak", name: "Ankara Regional 2025", season: 2025, league: 'frc' },
    { key: "2025tuhc", name: "Haliç Regional 2025", season: 2025, league: 'frc' },
    { key: "2025tuis", name: "Istanbul Regional 2025", season: 2025, league: 'frc' },
    { key: "2025tumb", name: "Marmara Regional 2025", season: 2025, league: 'frc' },
    { key: "2025tubk", name: "Bosphorus Regional 2025", season: 2025, league: 'frc' },
    // FTC Events
    { key: "2025itd1", name: "Turkey FTC Offseason 2025", season: 2025, league: 'ftc' },
    { key: "2025itd2", name: "Turkey FTC Regional 2025", season: 2025, league: 'ftc' }
];

const ALL_EVENTS = [...DEFAULT_EVENTS];
if (typeof CUSTOM_EVENTS !== 'undefined' && Array.isArray(CUSTOM_EVENTS)) {
    CUSTOM_EVENTS.forEach(ce => {
        const index = ALL_EVENTS.findIndex(de => de.key === ce.key);
        if (index !== -1) ALL_EVENTS[index] = ce;
        else ALL_EVENTS.push(ce);
    });
}

const ALL_SEASONS = [...new Set(ALL_EVENTS.map(e => e.season))].sort((a, b) => b - a);

const FRC_CONFIG = {
    seasons: ALL_SEASONS,
    events: ALL_EVENTS,
    defaultSeason: 2026,
    tbaKey: "kIarej54aLEjhvDFU7w4ky7cm3vsrhfi3zGZHU4Kbb0qgBV23gnlZ5coU6bz3ptJ",
    tbaProxyUrl: "https://www.thebluealliance.com/api/v3", // For direct fetch if no CORS issues, or use a proxy
    scoring: {
        frc: {
            2026: {
                auto: { scored: 4, level1: 3 },
                teleop: { shift: 2, shiftA: 3, shiftB: 4 },
                endgame: { park: 2, shallow: 6, deep: 12, shift: 5 }
            }
        },
        ftc: {
            2025: {
                auto: { sample: 4, specimen: 6, ascent: 3 },
                teleop: { sample: 2, specimen: 3 },
                endgame: { ascent1: 3, ascent2: 15, ascent3: 30 }
            }
        }
    },
    manualTeamsPath: "data/teams-manual.json",
    currentDomain: window.location.hostname,

    getTbaTeamUrl: (teamNumber, year = 2026) => `https://www.thebluealliance.com/team/${teamNumber}/${year}`,
    getTbaMatchUrl: (eventKey, type, matchNumber) => {
        const typeMap = { 'Qualification': 'qm', 'Practice': 'p', 'Playoffs': 'sf', 'Final': 'f' };
        const tbaType = typeMap[type] || 'qm';
        return `https://www.thebluealliance.com/match/${eventKey}_${tbaType}${matchNumber}`;
    }
};

async function fetchFRCMatches(eventKey) {
    const url = `${FRC_CONFIG.tbaProxyUrl}/event/${eventKey}/matches`;
    const res = await fetch(url, { headers: { "X-TBA-Auth-Key": FRC_CONFIG.tbaKey } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(match => {
        const redTeams = match.alliances.red.team_keys.map((t, i) => ({
            teamNumber: parseInt(t.replace("frc", "")),
            station: `Red${i + 1}`
        }));
        const blueTeams = match.alliances.blue.team_keys.map((t, i) => ({
            teamNumber: parseInt(t.replace("frc", "")),
            station: `Blue${i + 1}`
        }));
        return {
            matchNumber: match.match_number,
            description: `${match.comp_level} ${match.match_number}`,
            compLevel: match.comp_level,
            scoreRedFinal: match.alliances.red.score ?? 0,
            scoreBlueFinal: match.alliances.blue.score ?? 0,
            scoreBreakdown: match.score_breakdown || null,
            videos: match.videos || [],
            teams: [...redTeams, ...blueTeams],
            alliances: match.alliances
        };
    });
}

async function loadManualTeams() {
    try {
        const res = await fetch(FRC_CONFIG.manualTeamsPath);
        if (!res.ok) return {};
        return await res.json();
    } catch (e) {
        return {};
    }
}
