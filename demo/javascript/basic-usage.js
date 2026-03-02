const { Batcher } = require('../../dist');
const TEST_API_KEY = require('../../env-variables.js').default;

async function runDemo() {
    try {
        await forwardGeocodingExample();
        await reverseGeocodingExample();
    } catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    }
}

async function forwardGeocodingExample() {
    console.log('Forward Geocoding Example (Address → Coordinates)\n');

    const batcher = new Batcher(TEST_API_KEY);

    const addresses = [
        { name: 'Brandenburg Gate', city: 'Berlin', country: 'Germany' },
        { name: 'Eiffel Tower', city: 'Paris', country: 'France' },
        { name: 'Big Ben', city: 'London', country: 'United Kingdom' }
    ];

    const job = batcher.geocode(addresses, { pollIntervalMs: 2000 });

    job.onProgress((status) => {
        console.log(`📊 Status: ${status.state}`);
    });

    const result = await job.results();
    const data = await result.json();

    console.log('\nGeocoding Results:');
    data.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.formatted || item.name}`);
        console.log(`      📍 ${item.lat}, ${item.lon}`);
    });
}

async function reverseGeocodingExample() {
    console.log('\nReverse Geocoding Example (Coordinates → Address)\n');

    const batcher = new Batcher(TEST_API_KEY);

    const coordinates = [
        { lat: 52.5200, lon: 13.4050 },  // Berlin
        { lat: 48.8566, lon: 2.3522 },   // Paris
        { lat: 51.5074, lon: -0.1278 }   // London
    ];

    const job = batcher.reverseGeocode(coordinates, { pollIntervalMs: 2000 });

    job.onProgress((status) => {
        console.log(`📊 Status: ${status.state}`);
    });

    const result = await job.results();
    const data = await result.json();

    console.log('\nReverse Geocoding Results:');
    data.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.formatted || item.city}`);
        console.log(`      🏙️  ${item.city}, ${item.country}`);
    });
}

runDemo();
