const axios = require('axios');

const testRoute = async () => {
  try {
    // Sample route coordinates (using actual coordinates from Sri Lanka)
    const route = {
      coordinates: [
        { latitude: 6.9271, longitude: 79.8612 }, // Colombo
        { latitude: 6.9019, longitude: 79.8619 }, // Bambalapitiya
        { latitude: 6.8790, longitude: 79.8626 }, // Dehiwala
        { latitude: 6.8413, longitude: 79.8683 }  // Mount Lavinia
      ]
    };

    console.log('Analyzing route...');
    const response = await axios.post('http://localhost:3000/api/road-conditions/analyze', { route });
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

testRoute();
