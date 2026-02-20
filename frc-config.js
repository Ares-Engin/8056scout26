/* ============================================================
   TBA API CONFIGURATION (WORKS IN BROWSER – NO CORS ISSUES)
   Replace ONLY the apiKey and eventKey
   ============================================================ */

const FRC_CONFIG = {
    season: 2025,
    eventKey: "2025tuhc",   // Format: YEAR + event code (lowercase)
    apiKey: "kIarej54aLEjhvDFU7w4ky7cm3vsrhfi3zGZHU4Kbb0qgBV23gnlZ5coU6bz3ptJ", // ← PUT YOUR TBA KEY HERE
    level: "qm" // qm = qualification matches
};

/* Fetches match results from The Blue Alliance API */
async function fetchFRCMatches() {
    const url = `https://www.thebluealliance.com/api/v3/event/${FRC_CONFIG.eventKey}/matches`;

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
