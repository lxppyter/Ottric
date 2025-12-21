const axios = require('axios');

async function testRegister() {
  try {
    // Generate random user
    const random = Math.floor(Math.random() * 10000);
    const username = `testuser${random}@example.com`;
    const password = 'password123';
    
    console.log(`Attempting to register: ${username}`);
    
    const response = await axios.post('http://localhost:3000/auth/register', {
      username,
      password
    });
    
    console.log('Success:', response.status, response.data);
  } catch (error) {
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testRegister();
