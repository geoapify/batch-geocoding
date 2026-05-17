# Batch Geocoding

`@geoapify/batch-geocoding` is a Node.js/TypeScript library for forward and reverse geocoding at batch scale using [Geoapify’s async batch API](https://www.geoapify.com/batch-api/).  
How async processing works:
1. Create a batch job from addresses or coordinates.
2. The job is processed server-side; the client polls status using `pollIntervalMs`.
3. When the job is finished, retrieve results as JSON or CSV.

The package is designed for reliable bulk processing with a simple integration flow.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Installation: npm (recommended)](#npm-recommended)
- [Installation: unpkg (browser quick start)](#unpkg-browser-quick-start)
- [Usage](#usage)
- [Code Samples](#code-samples)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [FAQ](#faq)

## Features

1. Process up to 1000 addresses in a single batch request.
   Designed for large datasets where you want one async job instead of many single geocoding calls.
2. Configure location type and response language.
   Example: `geocodingParams: { type: "city", lang: "es" }` to bias results toward cities and return localized labels where available.
3. Forward geocode structured addresses or free-form addresses.
   Example structured input: `{ housenumber: "1000", street: "5th Ave", city: "New York", state: "NY", postcode: "10028", country: "United States" }`.
   Example free-form input: `{ text: "11 W 53rd St, New York, NY 10019, United States" }`.
4. Use bias and filter options for forward geocoding.
   Example bias: `geocodingParams: { bias: { proximity: { lon: -73.9632, lat: 40.7794 } } }`.
   Example filter: `geocodingParams: { filter: { countrycode: ["us"] } }`.
5. Reverse geocode coordinates.
   Example object format: `{ lat: 40.7794, lon: -73.9632 }`.
   Example tuple format: `[-73.9632, 40.7794]`.

## Installation

### npm (recommended)

Use npm/yarn/pnpm when you build a Node.js or TypeScript project. This gives you typed imports, lockfile-based reproducibility, and standard bundler/runtime integration.

```bash
npm install @geoapify/batch-geocoding
```

Then import it:

#### ESM
```javascript
import { Batcher } from '@geoapify/batch-geocoding';
```

#### CommonJS
```javascript
const { Batcher } = require('@geoapify/batch-geocoding');
```

### unpkg (browser quick start)

Use `unpkg` when you need a fast browser-only prototype without a package manager or build step.

```html
<script src="https://unpkg.com/@geoapify/batch-geocoding@1/dist/batch-geocoding.js"></script>
<script>
  const { Batcher } = window.BatchGeocoding;
  const batcher = new Batcher("YOUR_API_KEY");
</script>
```

When to use `unpkg`:
- quick demos, experiments, or internal prototypes
- simple static pages where adding a full build toolchain is unnecessary

When not to use `unpkg`:
- production apps that should pin dependencies via lockfiles and bundling
- client-side apps where exposing API keys is a security risk

## Usage

### 1. Creating a Batcher

Create a [`Batcher`](#batcher) instance with your Geoapify API key. Sign up at [geoapify.com](https://www.geoapify.com/) to get a free API key that includes up to 3000 addresses per day.

```ts
import { Batcher } from "@geoapify/batch-geocoding";

const batcher = new Batcher("YOUR_API_KEY");
```

### 2. Creating a Job

Create a job with `geocode()` or `reverseGeocode()` from [`Batcher`](#batcher). The job starts automatically.

```ts
const forwardJob = batcher.geocode(
  [{ text: "1000 5th Ave, New York, NY 10028, United States" }],
  { geocodingParams: { lang: "en" } }
);

const reverseJob = batcher.reverseGeocode(
  [{ lat: 40.7794, lon: -73.9632 }],
  { geocodingParams: { lang: "en" } }
);
```

> Priority note:
> - `priority` can be in the range `[0.5, 1]`.
> - Lower priority means lower cost (`regular_price * priority`), but processing can take longer.
> - During high-traffic periods, low-priority jobs can take a few hours.

```ts
const cheaperJob = batcher.geocode(
  [{ text: "11 W 53rd St, New York, NY 10019, United States" }],
  { priority: 0.5, geocodingParams: { lang: "en" } }
);
```

### 3. Getting Results

Use [`job.getResults()`](#batcherjob) and then read [`json()`](#batchresult) or [`csv()`](#batchresult).

```ts
const jsonResult = await forwardJob.getResults().then(result => result.json());
const csvResult = await reverseJob.getResults().then(result => result.csv());
```

## Code Samples

### Example 1: Forward Geocoding (Address → Coordinates)

```ts
import { Batcher } from "@geoapify/batch-geocoding";

const batcher = new Batcher("YOUR_API_KEY");

const job = batcher.geocode(
  [
    {
      text: "1000 5th Ave, New York, NY 10028, United States",
      importId: "internal-1"
    },
    {
      text: "11 W 53rd St, New York, NY 10019, United States",
      importId: "internal-2"
    }
  ],
  {
    preserveFields: ["importId"],
    geocodingParams: {
      lang: "en",
      bias: { proximity: { lon: -73.9776, lat: 40.7614 } }
    }
  }
);

const jsonResult = await job.getResults().then(result => result.json());
```

### Example 2: Reverse Geocoding (Coordinates → Address)

```ts
import { Batcher } from "@geoapify/batch-geocoding";

const batcher = new Batcher("YOUR_API_KEY");

const job = batcher.reverseGeocode(
  [
    { lat: 40.7794, lon: -73.9632, custom: "met-1" },
    { lat: 40.7614, lon: -73.9776, custom: "moma-1" }
  ],
  {
    preserveFields: ["custom"],
    geocodingParams: { lang: "en" }
  }
);

const csvResults = await job.getResults().then(result => result.csv());
```

### Example 3: Creating a Job with Structured Addresses

```ts
import { Batcher } from "@geoapify/batch-geocoding";

const batcher = new Batcher("YOUR_API_KEY");

const job = batcher.geocode(
  [
    {
      housenumber: "1000",
      street: "5th Ave",
      city: "New York",
      state: "NY",
      postcode: "10028",
      country: "United States",
      recordId: "met-structured"
    },
    {
      housenumber: "11",
      street: "W 53rd St",
      city: "New York",
      state: "NY",
      postcode: "10019",
      country: "United States",
      recordId: "moma-structured"
    }
  ],
  {
    preserveFields: ["recordId"],
    geocodingParams: { lang: "en" }
  }
);

const jsonResult = await job.getResults().then(result => result.json());
```

### Example 4: Search Postcodes by Lat/Lon

```ts
import { Batcher } from "@geoapify/batch-geocoding";

const batcher = new Batcher("YOUR_API_KEY");

const job = batcher.reverseGeocode(
  [
    { lat: 40.7794, lon: -73.9632, coordinateId: "point-1" },
    { lat: 40.7614, lon: -73.9776, coordinateId: "point-2" }
  ],
  {
    preserveFields: ["coordinateId"],
    geocodingParams: { type: "postcode", lang: "en" }
  }
);

const postcodeResults = await job.getResults().then(result => result.json());
```

### Example 5: Process a Big Batch (>1000 rows) with Rate Limiting

Use this pattern when you need to process more than 1000 inputs.  
The example splits data into chunks of up to 1000 rows, submits chunk-jobs through `@geoapify/request-rate-limiter`, and merges all chunk results into one array.

```ts
import { Batcher, FreeFormAddress } from "@geoapify/batch-geocoding";
import RequestRateLimiter from "@geoapify/request-rate-limiter";

const API_KEY = process.env.GEOAPIFY_API_KEY ?? "";
const batcher = new Batcher(API_KEY);

const allAddresses: FreeFormAddress[] = [
  { text: "1000 5th Ave, New York, NY 10028, United States" },
  // ... many more rows
];

const MAX_BATCH_SIZE = 1000;
const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const chunks = chunkArray(allAddresses, MAX_BATCH_SIZE);

// Each function submits one chunk as a separate batch job.
const requests = chunks.map((chunk, chunkIndex) => {
  return async () => {
    const job = batcher.geocode(chunk, {
      priority: 0.5,
      geocodingParams: { lang: "en" }
    });
    const rows = await job.getResults().then(result => result.json());
    return { chunkIndex, rows };
  };
});

// Process up to 2 chunk-jobs per second.
const chunkResults = await RequestRateLimiter.rateLimitedRequests(
  requests,
  2,      // maxRequests
  1000,   // intervalMs
  {
    onProgress: (progress) => {
      console.log(`Progress: ${progress.completedRequests}/${progress.totalRequests}`);
    }
  }
);

const mergedResults = chunkResults.flatMap(item => item.rows);
console.log("Total rows:", mergedResults.length);
```

## API Reference

Use this section as a quick lookup for the public API surface.  
It summarizes constructors, methods, and option types you will use most when integrating the library.

### Batcher

| Method | Signature | Description |
|---|---|---|
| constructor | `new Batcher(apiKey: string)` | Creates a batcher instance. Throws `ValidationError` if API key is empty. You need a Geoapify API key; sign up at [geoapify.com](https://www.geoapify.com/) to get one. |
| geocode | geocode(items: ([StructuredAddress](#structuredaddress) \| [FreeFormAddress](#freeformaddress))[], options?: [BatchGeocodeOptions](#batchgeocodeoptions)): [BatcherJob](#batcherjob) | Submits a forward-geocoding batch job from structured or free-form addresses. |
| reverseGeocode | reverseGeocode(coordinates: ([Coordinates (object)](#coordinates-object) \| [Coordinates (tuple)](#coordinates-tuple))[], options?: [BatchGeocodeOptions](#batchgeocodeoptions)): [BatcherJob](#batcherjob) | Submits a reverse-geocoding batch job from coordinates. |

### BatcherJob

| Method | Signature | Description |
|---|---|---|
| onProgress | `onProgress(callback: (status: JobStatus) => void): void` | Subscribes to status updates (`submitting`, `pending`, `finished`, `failed`). |
| getStatus | `getStatus(): JobStatus` | Returns current job state. |
| getResults | `getResults(): Promise<BatchResult>` | Waits for completion and returns a result wrapper (`json()` / `csv()`). |
| getId | `getId(): string \| undefined` | Returns the job id after successful submission. |

### BatchResult

Returned by `await job.getResults()`.

| Method | Signature | Description |
|---|---|---|
| json | `json(): Promise<GeocodingResultJson>` | Returns results as an array of objects. Includes default geocoding fields and optional `preserved_<field>` values when `preserveFields` was set at job creation. |
| csv | `csv(): Promise<string>` | Returns results as CSV text. Nested objects are flattened with dot-path headers (for example `datasource.sourcename`). |

### BatchGeocodeOptions

| Field | Type | Required/Optional | Description |
|---|---|---|---|
| pollIntervalMs | `number` | optional | Interval (ms) between job-status checks. Default: `1000`. Lower values detect completion sooner but send more status requests; higher values reduce status requests but may delay completion detection. Typical values: `500-2000` for faster feedback, `3000-10000` to reduce polling load. |
| preserveFields | `string[]` | optional | Copies listed input fields to each output row as `preserved_<field>`. |
| priority | `number` | optional | Job priority in range `[0.5, 1]`. Default: `1`. Lower values are cheaper (`regular_price * priority`) but can take longer to process; during high traffic it may take a few hours. |
| geocodingParams | [`GeocodeOptions`](#geocodeoptions) | optional | Geocoding query options used for the whole batch. |

### Other Types

#### GeocodeOptions

Geocoding parameters passed through `BatchGeocodeOptions.geocodingParams`.
`type` and `lang` are shared across forward and reverse geocoding.
`filter` and `bias` are for forward geocoding only.

| Field | Type | Required/Optional | Applies To | Description |
|---|---|---|---|---|
| type | `LocationType` | optional | Forward + Reverse | Restricts result type (for example `city`, `country`, `street`, `amenity`). |
| lang | `string` | optional | Forward + Reverse | Preferred result language (for example `en`, `es`, `fr`). |
| filter | `object` | optional | Forward only | Hard restriction for where results can come from. |
| bias | `object` | optional | Forward only | Soft preference to rank closer/more relevant places higher. |

For reverse geocoding, use only shared fields (`type`, `lang`) in `geocodingParams`.

`filter` fields:

| Field | Type | Required/Optional | Description |
|---|---|---|---|
| countrycode | `CountryCode[]` | optional | Restrict results to one or more countries (for example `["us"]`). |
| circle | `{ lon, lat, radiusMeters }` | optional | Restrict results to a circle. |
| rect | `{ lon1, lat1, lon2, lat2 }` | optional | Restrict results to a bounding box. |
| place | `string` | optional | Restrict results to a Geoapify place id. |

`bias` fields:

| Field | Type | Required/Optional | Description |
|---|---|---|---|
| countrycode | `CountryCode[]` | optional | Prefer results in one or more countries. |
| circle | `{ lon, lat, radiusMeters }` | optional | Prefer results near a circle region. |
| rect | `{ lon1, lat1, lon2, lat2 }` | optional | Prefer results inside/near a bounding box. |
| proximity | `{ lon, lat }` | optional | Prefer results near a point. |

Example:

```ts
geocodingParams: {
  type: "postcode",
  lang: "en",
  filter: { countrycode: ["us"] },
  bias: { proximity: { lon: -73.98513, lat: 40.7589 } }
}
```

#### StructuredAddress

Use when address parts are already separated into fields.

| Field | Type | Required |
|---|---|---|
| name | `string` | no |
| housenumber | `string` | no |
| street | `string` | no |
| postcode | `string` | no |
| city | `string` | no |
| state | `string` | no |
| country | `string` | no |
| ...customFields | `unknown` | no |

#### FreeFormAddress

Use when you only have one full-text address string.

| Field | Type | Required |
|---|---|---|
| text | `string` | yes |
| ...customFields | `unknown` | no |

#### Coordinates (object)

Use explicit latitude/longitude fields.

| Field | Type | Required |
|---|---|---|
| lat | `number` | yes |
| lon | `number` | yes |
| ...customFields | `unknown` | no |

#### Coordinates (tuple)

Compact coordinate format in `[lon, lat]` order.

## Error Handling

The library throws typed errors so you can handle each failure case explicitly.

| Error Type | When It Is Thrown | Extra Fields |
|---|---|---|
| `ValidationError` | Invalid local input (for example empty API key, empty input arrays, or calling `getResults()` before `start()` on a manually created `BatcherJob`). | none |
| `JobSubmitError` | Batch job submission failed (for example request rejected at submit stage). | `statusCode?: number` |
| `ApiError` | API request failed after submission (for example status polling or result retrieval errors). | `statusCode: number`, `responseBody?: unknown` |

All error classes extend `BatchGeocodingError`.

```ts
import { Batcher, ValidationError, JobSubmitError, ApiError } from "@geoapify/batch-geocoding";

const batcher = new Batcher(process.env.GEOAPIFY_API_KEY ?? "");

try {
  const job = batcher.geocode([{ text: "1000 5th Ave, New York, NY 10028, United States" }]);
  const json = await job.getResults().then(result => result.json());
  console.log("Rows:", json.length);
} catch (error: unknown) {
  if (error instanceof ValidationError) {
    console.error("Validation error:", error.message);
  } else if (error instanceof JobSubmitError) {
    console.error("Job submit error:", error.statusCode, error.message);
  } else if (error instanceof ApiError) {
    console.error("API error:", error.statusCode, error.message);
    console.error("Response body:", error.responseBody);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

## FAQ

**Can I mix structured and free-form addresses in one forward batch?**  
Yes. `geocode()` accepts an array of `StructuredAddress | FreeFormAddress`, so both input styles can be combined in one job.

**Does each input return only one geocoding result?**  
Yes. The library requests one best match per input row.

**How do I keep some input fields in output results?**  
Use `preserveFields`. The library keeps default Geoapify fields and adds preserved fields as flat values with `preserved_` prefix.

```ts
const job = batcher.geocode(
  [{ text: "1000 5th Ave, New York, NY 10028, United States", importId: "row-1" }],
  { preserveFields: ["importId"] }
);
// result row includes preserved_importId: "row-1"
```

**What is `pollIntervalMs`?**  
It is how often the SDK checks job status from the API while waiting for completion (default: `1000` ms).  
Lower values poll more frequently and detect completion sooner, but send more status requests.  
Higher values reduce polling requests, but can delay when your app notices that a job is finished.

```ts
const job = batcher.geocode(addresses, { pollIntervalMs: 5000 });
```

Quick guidance:
- Use `500-2000` ms when you want faster UI feedback.
- Use `3000-10000` ms for background jobs to reduce polling load.

**How to process a batch with 50% discount?**  
Set `priority: 0.5`.

```ts
const job = batcher.geocode(addresses, { priority: 0.5 });
```

**How are nested objects represented in CSV output?**  
Nested objects are flattened using dot-path column names, for example `datasource.sourcename`.

**How can I process more than 1000 addresses?**  
Split input into chunks of up to 1000, then submit multiple jobs. Use [@geoapify/request-rate-limiter](https://www.npmjs.com/package/@geoapify/request-rate-limiter) to control request rate and run multiple chunked jobs in parallel safely.

**What usage limits apply to the Geoapify API?**  
Limits depend on your Geoapify plan and can include request volume and throughput constraints.  
For current limits and quotas, always check the official pricing page: [https://www.geoapify.com/pricing/](https://www.geoapify.com/pricing/).

**Can I use this library for free?**  
Yes. This npm library is open source and free to use.  
Geoapify API access itself is plan-based: there is a free tier (up to 3000 addresses / day), and paid plans for higher usage.  
See current free-tier and paid-plan details here: [https://www.geoapify.com/pricing/](https://www.geoapify.com/pricing/).
