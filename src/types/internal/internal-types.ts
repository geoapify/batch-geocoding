// Internal - Used internally within the library (not exposed to users)
import { BatchGeocodeOptions, Coordinates, StructuredAddress } from "../external/external-types";

export enum OperationType {
  Forward = "forward",
  Reverse = "reverse"
}

export interface GeocodingOperation {
  type: OperationType;
  addresses?: StructuredAddress[];
  coordinates?: Coordinates[];
  options?: BatchGeocodeOptions;
}
