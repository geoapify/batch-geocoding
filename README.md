# batch-geocoding

**A lightweight, zero-dependency Node.js library for batch geocoding using Geoapify's async batch engine**

The library provides a simple Job-based API for processing large volumes of geocoding requests efficiently. It helps:

* **Forward Geocoding**: Convert addresses to coordinates (latitude/longitude).

* **Reverse Geocoding**: Convert coordinates to addresses.

* **Batch Processing**: Process thousands of geocoding requests efficiently using Geoapify's async batch engine.

* **Track Progress**: Monitor job status with progress callbacks.

## Installation

Install the library via npm:

```bash
npm install @geoapify/batch-geocoding
```

Then, import it in your code:

#### ESM
```javascript
import { Batcher } from '@geoapify/batch-geocoding';
```

#### CommonJS
```javascript
const { Batcher } = require('@geoapify/batch-geocoding');
```

## Usage

The library exposes a `Batcher` class with two main methods: `geocode()` for forward geocoding and `reverseGeocode()` for reverse geocoding.

```javascript
const batcher = new Batcher('YOUR_API_KEY');

// Forward geocoding
const job = batcher.geocode(addresses, options);

// Reverse geocoding
const job = batcher.reverseGeocode(coordinates, options);
```

* **addresses**: An array of structured address objects with optional fields: `name`, `housenumber`, `street`, `postcode`, `city`, `state`, `country`.
* **coordinates**: An array of coordinate objects with `lat` and `lon` properties.
* **options** (optional):
    * **pollIntervalMs**: Polling interval in milliseconds for checking job status. Default: `1000`.
    * **preserveFields**: Array of field names from the input to include in the results.
    * **priority**: Priority level for the batch job. Default: `1`.
    * **common**: Common geocoding options applied to all requests (e.g., `type`, `lang`, `filter`, `bias`).

## Code Samples

### Example 1: Forward Geocoding (Address → Coordinates)

```javascript
import { Batcher } from '@geoapify/batch-geocoding';

const batcher = new Batcher('YOUR_API_KEY');

const addresses = [
    { name: 'Brandenburg Gate', city: 'Berlin', country: 'Germany' },
    { name: 'Eiffel Tower', city: 'Paris', country: 'France' },
    { name: 'Big Ben', city: 'London', country: 'United Kingdom' }
];

const job = batcher.geocode(addresses, { pollIntervalMs: 2000 });

job.onProgress((status) => {
    console.log(`Status: ${status.state}`);
});

const result = await job.results();
const data = await result.json();

data.forEach((item, i) => {
    console.log(`${i + 1}. ${item.formatted || item.name}`);
    console.log(`   Coordinates: ${item.lat}, ${item.lon}`);
});
```

### Example 2: Reverse Geocoding (Coordinates → Address)

```javascript
import { Batcher } from '@geoapify/batch-geocoding';

const batcher = new Batcher('YOUR_API_KEY');

const coordinates = [
    { lat: 52.5200, lon: 13.4050 },  // Berlin
    { lat: 48.8566, lon: 2.3522 },   // Paris
    { lat: 51.5074, lon: -0.1278 }   // London
];

const job = batcher.reverseGeocode(coordinates, { pollIntervalMs: 2000 });

job.onProgress((status) => {
    console.log(`Status: ${status.state}`);
});

const result = await job.results();
const data = await result.json();

data.forEach((item, i) => {
    console.log(`${i + 1}. ${item.formatted || item.city}`);
    console.log(`   City: ${item.city}, ${item.country}`);
});
```

## Result Formats

The job results can be retrieved in two formats:

```javascript
const result = await job.results();

// As JSON array
const jsonData = await result.json();

// As CSV string
const csvData = await result.csv();
```

## Error Handling

The library provides typed error classes for handling different failure scenarios:

* **ValidationError**: Thrown when input validation fails (e.g., empty API key, no addresses provided).
* **JobSubmitError**: Thrown when the batch job submission fails. Includes `message` and `statusCode`.
* **ApiError**: Thrown when API requests fail. Includes `message`, `statusCode`, and `responseBody`.

All errors extend `BatchGeocodingError`.

```javascript
import { Batcher, ValidationError, ApiError, JobSubmitError } from '@geoapify/batch-geocoding';

try {
    const job = batcher.geocode(addresses);
    const result = await job.results();
} catch (error) {
    if (error instanceof ValidationError) {
        console.error('Invalid input:', error.message);
    } else if (error instanceof JobSubmitError) {
        console.error('Job submission failed:', error.message, error.statusCode);
    } else if (error instanceof ApiError) {
        console.error('API error:', error.message, error.statusCode, error.responseBody);
    }
}
```

With `@geoapify/batch-geocoding`, you can efficiently process large volumes of geocoding requests using Geoapify's optimized batch engine. The simple Job-based API makes it easy to track progress and retrieve results in your preferred format.
