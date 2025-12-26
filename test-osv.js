const axios = require('axios');
(async () => {
  try {
    const res = await axios.post('https://api.osv.dev/v1/querybatch', {
      queries: [{ package: { purl: 'pkg:npm/next@13.4.0' } }]
    });
    // Log specifically the first vulnerability's severity structure
    if (res.data.results && res.data.results[0] && res.data.results[0].vulns) {
         console.log(JSON.stringify(res.data.results[0].vulns[0], null, 2));
    } else {
         console.log('No vulns found');
    }
  } catch(e) {
    console.error(e.message);
  }
})();
