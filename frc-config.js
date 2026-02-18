/* ============================================================
   FRC API CONFIGURATION
   Update these values for each event.
   Get credentials at: frc-events.firstinspires.org/services/API
   ============================================================ */

const FRC_CONFIG = {
    season: 2025,
    eventCode: "TUHC",          // ← update to your event code
    username: "aresengin56",  // ← your FRC API username
    token: "98c930fc",        // ← your FRC API token
    level: "Qualification"      // Qualification | Playoff
};

/* Builds the Basic Auth header from username + token */
function frcAuthHeader() {
    return "Basic " + btoa(FRC_CONFIG.username + ":" + FRC_CONFIG.token);
}

/* Fetches match results from the FRC API */
async function fetchFRCMatches() {
    const url = `https://frc-api.firstinspires.org/v3.0/${FRC_CONFIG.season}/matches/${FRC_CONFIG.eventCode}?tournamentLevel=${FRC_CONFIG.level}`;
    const res = await fetch(url, {
        headers: {
            "Authorization": frcAuthHeader(),
            "If-Modified-Since": ""
        }
    });
    if (!res.ok) throw new Error(`FRC API error: ${res.status}`);
    const json = await res.json();
    return json.Matches || [];
}
