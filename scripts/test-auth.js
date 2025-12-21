const axios = require('axios');

async function testAuth() {
    const baseUrl = 'http://localhost:3000/auth';
    const user = { username: 'test_user_' + Date.now(), password: 'password123' };

    try {
        console.log('1. Attempting Register:', user);
        const regRes = await axios.post(`${baseUrl}/register`, user);
        console.log('   Register Success:', regRes.data);
    } catch (err) {
        console.error('   Register Failed:', err.response?.data || err.message);
        return;
    }

    try {
        console.log('2. Attempting Login:', user);
        const loginRes = await axios.post(`${baseUrl}/login`, user);
        console.log('   Login Success! Token received:', loginRes.data);
    } catch (err) {
        console.error('   Login Failed:', err.response?.data || err.message);
    }
}

testAuth();
