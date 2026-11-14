export interface MoonCatalogueCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Raw NASA catalogue locations remain the public record. A coordinate is only
 * exposed separately when its supplied numeric pair sits inside physical
 * latitude/longitude bounds; this app never repairs or infers a replacement.
 */
export type MoonCoordinateStatus = 'valid' | 'invalid' | 'unavailable';

export interface MoonCatalogueRow {
  object: string;
  location: string;
  section: string;
  quantity: number;
  seeBelow: boolean;
  subItem: boolean;
  coordinateStatus: MoonCoordinateStatus;
  coordinates?: MoonCatalogueCoordinates;
  coordinateIssue?: string;
}

export interface MoonCatalogueStats {
  lineCount: number;
  directObjectCount: number;
  bracketQuantitySum: number;
  displayedCount: number;
  sourcePdf: string;
  generatedFrom: string;
  validCoordinateCount: number;
  invalidCoordinateCount: number;
}
