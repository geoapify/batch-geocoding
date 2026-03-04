import {
    ApiError, BatchGeocodeCommonOptions,
    BatchGeocodeOptions,
    BatchInput,
    BatchRequestBody,
    GeocodingOperation,
    JobStatusResult,
    JobSubmitError,
    OperationType,
    SubmitJobResponse
} from "./types";

const DEFAULT_BASE_URL = "https://api.geoapify.com";
const REQUEST_PARAM_LIMIT = "1";

export class ApiClient {
    private readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async submitJob(operation: GeocodingOperation): Promise<SubmitJobResponse> {
        if (operation.type === OperationType.Forward) {
            const inputs: BatchInput[] = operation.addresses!.map((item) => ({params: item}));
            return this.executeSubmitJob("/v1/geocode/search", inputs, operation.options);
        } else {
            const inputs: BatchInput[] = operation.coordinates!.map((coord) => ({
                params: (() => {
                    if (Array.isArray(coord)) {
                        return {lon: coord[0], lat: coord[1]};
                    }
                    return coord;
                })(),
            }));
            return this.executeSubmitJob("/v1/geocode/reverse", inputs, operation.options);
        }
    }

    async getJobStatus(jobId: string): Promise<JobStatusResult> {
        const url = `${DEFAULT_BASE_URL}/v1/batch?id=${encodeURIComponent(jobId)}&apiKey=${this.apiKey}`;

        const response = await fetch(url);

        if (response.status === 202) {
            const body: any = await response.json();
            return {
                id: body.id,
                pending: true
            };
        }

        if (response.status === 200) {
            const data: any = await response.json();

            const results = data.results.map((item: any) => {
                const feature = item.result.features[0];
                if (!feature) {
                    return {};
                }
                return {
                    ...feature.properties,
                    lat: feature.geometry.coordinates[1],
                    lon: feature.geometry.coordinates[0]
                };
            });

            return {
                id: jobId,
                pending: false,
                results: results
            };
        }

        const errorBody = await response.json();
        throw new ApiError(
            `Failed to get job status: ${response.statusText}`,
            response.status,
            errorBody
        );
    }

    private async executeSubmitJob(api: string, inputs: BatchInput[], options?: BatchGeocodeOptions): Promise<SubmitJobResponse> {
        const url = `${DEFAULT_BASE_URL}/v1/batch?apiKey=${this.apiKey}`;

        let params = this.generateRequestParams(options);
        const body: BatchRequestBody = {
            api: api,
            inputs: inputs,
            params: params
        };

        if (options?.priority !== undefined) {
            body.priority = options.priority;
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (response.status !== 202) {
            throw new JobSubmitError(
                `Failed to submit job: ${response.statusText}`,
                response.status
            );
        }

        const data = await response.json();
        return data as SubmitJobResponse;
    }

    private generateRequestParams(options?: BatchGeocodeOptions): any {
        let params: any = {
            limit: REQUEST_PARAM_LIMIT
        }
        if (!options || !options.common) {
            return params;
        } else {
            let common = options.common;
            if (common.type) {
                params['type'] = common.type;
            }
            if (common.lang) {
                params['lang'] = common.lang;
            }
            let filters = this.getFilters(common);
            if (filters && filters.length > 0) {
                params['filter'] = filters.join('|');
            }
            let biases = this.getBiases(common);
            if (biases && biases.length > 0) {
                params['bias'] = biases.join('|');
            }
        }
        return params;
    }

    private getFilters(common: BatchGeocodeCommonOptions): string[] {
        const filters: string[] = [];
        if (!common.filter) {
            return filters;
        }

        let biasCountryCode = common.filter.countrycode;
        if (biasCountryCode && biasCountryCode.length) {
            filters.push(`countrycode:${biasCountryCode.join(',').toLowerCase()}`);
        }

        let biasCircle = common.filter.circle;
        if (biasCircle && this.isLatitude(biasCircle.lat) && this.isLongitude(biasCircle.lon) && biasCircle.radiusMeters > 0) {
            filters.push(`circle:${biasCircle.lon},${biasCircle.lat},${biasCircle.radiusMeters}`);
        }

        let biasRect = common.filter.rect;
        if (biasRect && this.isLatitude(biasRect.lat1) && this.isLongitude(biasRect.lon1) && this.isLatitude(biasRect.lat2) && this.isLongitude(biasRect.lon2)) {
            filters.push(`rect:${biasRect.lon1},${biasRect.lat1},${biasRect.lon2},${biasRect.lat2}`);
        }

        if (common.filter.place) {
            filters.push(`place:${common.filter.place}`);
        }
        return filters;
    }

    private getBiases(common: BatchGeocodeCommonOptions): string[] {
        const biases: string[] = [];
        if (!common.bias) {
            return biases;
        }

        let biasCountryCode = common.bias.countrycode;
        if (biasCountryCode && biasCountryCode.length) {
            biases.push(`countrycode:${biasCountryCode.join(',').toLowerCase()}`);
        }

        let biasCircle = common.bias.circle;
        if (biasCircle && this.isLatitude(biasCircle.lat) && this.isLongitude(biasCircle.lon) && biasCircle.radiusMeters > 0) {
            biases.push(`circle:${biasCircle.lon},${biasCircle.lat},${biasCircle.radiusMeters}`);
        }

        let biasRect = common.bias.rect;
        if (biasRect && this.isLatitude(biasRect.lat1) && this.isLongitude(biasRect.lon1) && this.isLatitude(biasRect.lat2) && this.isLongitude(biasRect.lon2)) {
            biases.push(`rect:${biasRect.lon1},${biasRect.lat1},${biasRect.lon2},${biasRect.lat2}`);
        }

        let biasProximity = common.bias.proximity;
        if (biasProximity && this.isLatitude(biasProximity.lat) && this.isLongitude(biasProximity.lon)) {
            biases.push(`proximity:${biasProximity.lon},${biasProximity.lat}`);
        }

        return biases
    }

    private isLatitude(num: any) {
        return num !== '' && num !== null && isFinite(num) && Math.abs(num) <= 90;
    }

    private isLongitude(num: any) {
        return num !== '' && num !== null && isFinite(num) && Math.abs(num) <= 180;
    }
}
