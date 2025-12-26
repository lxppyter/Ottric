const axios = require('axios');
(async () => {
    try {
        console.log("Fetching GHSA-3h52-269p-cp9r...");
        const res = await axios.get('https://api.osv.dev/v1/vulns/GHSA-3h52-269p-cp9r');
        console.log("Severity Field:", JSON.stringify(res.data.severity, null, 2));
        console.log("Database Specific:", JSON.stringify(res.data.database_specific, null, 2));
        console.log("Aliases:", JSON.stringify(res.data.aliases, null, 2));
    } catch (e) { console.error(e.message); }
})();
