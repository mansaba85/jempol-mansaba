const axios = require('axios');
axios.get('http://localhost:3001/api/machine/sync-one/1', {
  headers: { 'Accept': 'application/json' }
}).then(r => console.log("SUCCESS:", r.data)).catch(e => console.error("ERROR:", e.response?.data || e.message));
