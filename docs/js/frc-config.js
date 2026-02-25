/* ============================================================
   TBA API CONFIGURATION (WORKS IN BROWSER – NO CORS ISSUES)
   Replace ONLY the apiKey and eventKey
   ============================================================ */

const FRC_CONFIG = {
    seasons: [2025, 2026],
    events: [
        { key: "2025tuhc", name: "Haliç Regional 2025", season: 2025 },
        { key: "2025tuis", name: "Istanbul Regional 2025", season: 2025 },
        { key: "2025tubs", name: "Bosphorus Regional 2025", season: 2025 },
        { key: "2025marm", name: "Marmara Regional 2025", season: 2025 },
        { key: "2025bask", name: "Başkent Regional 2025", season: 2025 },
        { key: "2026tuhc", name: "Haliç Regional 2026", season: 2026 },
        { key: "2026tuis", name: "Istanbul Regional 2026", season: 2026 },
        { key: "2026marm", name: "Marmara Regional 2026", season: 2026 },
        { key: "2026bask", name: "Başkent Regional 2026", season: 2026 }
    ],
    defaultSeason: 2026,
    apiKey: "kIarej54aLEjhvDFU7w4ky7cm3vsrhfi3zGZHU4Kbb0qgBV23gnlZ5coU6bz3ptJ",
    level: "qm"
};

/* Fetches match results from The Blue Alliance API */
async function fetchFRCMatches(eventKey) {
    const key = eventKey || FRC_CONFIG.events[0].key;
    const url = `https://www.thebluealliance.com/api/v3/event/${key}/matches`;

    const res = await fetch(url, {
        headers: {
            "X-TBA-Auth-Key": FRC_CONFIG.apiKey
        }
    });

    if (!res.ok) {
        throw new Error(`TBA API error: ${res.status}`);
    }

    const data = await res.json();

    // Filter only qualification matches if needed
    const filtered = data.filter(m => m.comp_level === FRC_CONFIG.level);

    // Convert TBA format → FIRST API format (so your matches.js works unchanged)
    return filtered.map(match => {
        const redTeams = match.alliances.red.team_keys.map((t, i) => ({
            teamNumber: parseInt(t.replace("frc", "")),
            station: `Red${i + 1}`,
            dq: false
        }));

        const blueTeams = match.alliances.blue.team_keys.map((t, i) => ({
            teamNumber: parseInt(t.replace("frc", "")),
            station: `Blue${i + 1}`,
            dq: false
        }));

        return {
            matchNumber: match.match_number,
            description: `Qualification ${match.match_number}`,
            actualStartTime: match.actual_time
                ? new Date(match.actual_time * 1000).toISOString()
                : null,
            scoreRedFinal: match.alliances.red.score ?? 0,
            scoreBlueFinal: match.alliances.blue.score ?? 0,
            scoreRedAuto: null,
            scoreBlueAuto: null,
            scoreRedFoul: null,
            scoreBlueFoul: null,
            teams: [...redTeams, ...blueTeams]
        };
    });
}
