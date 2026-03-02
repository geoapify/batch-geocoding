/**
 * Basic JavaScript Example - Batch Geocoding
 * 
 * This example demonstrates how to use @geoapify/batch-geocoding
 * to geocode addresses and reverse geocode coordinates.
 *
 */

const { Batcher } = require('../../dist');
const TEST_API_KEY = require('../../env-variables.js').default;

async function runDemo() {
    console.log('🚀 Batch Geocoding JavaScript Demo\n');
    console.log('='.repeat(60));

    try {
        await forwardGeocodingExample();
        await reverseGeocodingExample();
        await customBaseUrlExample();

        console.log('\n' + '='.repeat(60));
        console.log('✅ Demo completed successfully!\n');
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

async function forwardGeocodingExample() {
    console.log('🌍 Forward Geocoding Example (Address → Coordinates)\n');

    const batcher = new Batcher(TEST_API_KEY);

    const addresses = [
        { name: 'Brandenburg Gate', city: 'Berlin', country: 'Germany' },
        { name: 'Eiffel Tower', city: 'Paris', country: 'France' },
        { name: 'Big Ben', city: 'London', country: 'United Kingdom' }
    ];

    console.log('📍 Addresses to geocode:');
    addresses.forEach((addr, i) => {
        console.log(`   ${i + 1}. ${addr.name}, ${addr.city}, ${addr.country}`);
    });

    const job = batcher.geocode(addresses, { pollIntervalMs: 2000 });

    job.onProgress((status) => {
        console.log(`📊 Status: ${status.state}${status.progress ? ` (${status.progress.done}/${status.progress.total})` : ''}`);
    });

    const result = await job.results();
    const data = await result.json();

    console.log('\n✅ Geocoding Results:');
    data.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.formatted || item.name}`);
        console.log(`      📍 ${item.lat}, ${item.lon}`);
    });
}

async function reverseGeocodingExample() {
    console.log('\n🌍 Reverse Geocoding Example (Coordinates → Address)\n');

    const batcher = new Batcher(TEST_API_KEY);

    const coordinates = [
        { lat: 52.5200, lon: 13.4050 },  // Berlin
        { lat: 48.8566, lon: 2.3522 },   // Paris
        { lat: 51.5074, lon: -0.1278 }   // London
    ];

    console.log('📍 Coordinates to reverse geocode:');
    coordinates.forEach((coord, i) => {
        console.log(`   ${i + 1}. ${coord.lat}, ${coord.lon}`);
    });

    const job = batcher.reverseGeocode(coordinates, { pollIntervalMs: 2000 });

    job.onProgress((status) => {
        console.log(`📊 Status: ${status.state}${status.progress ? ` (${status.progress.done}/${status.progress.total})` : ''}`);
    });

    const result = await job.results();
    const data = await result.json();

    console.log('\n✅ Reverse Geocoding Results:');
    data.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.formatted || item.city}`);
        console.log(`      🏙️  ${item.city}, ${item.country}`);
    });
}

async function customBaseUrlExample() {
    console.log('\n🌍 Custom Base URL Example\n');

    // Use custom base URL (useful for testing or self-hosted API)
    const batcher = new Batcher(TEST_API_KEY, 'https://api.geoapify.com');

    const addresses = [
        { city: 'Rome', country: 'Italy' }
    ];

    console.log('📍 Using custom base URL: https://api.geoapify.com');

    const job = batcher.geocode(addresses, { pollIntervalMs: 2000 });

    const result = await job.results();
    const data = await result.json();

    console.log('\n✅ Result:');
    console.log(`   ${data[0].formatted || data[0].city}`);
    console.log(`   📍 ${data[0].lat}, ${data[0].lon}`);
}

runDemo();
