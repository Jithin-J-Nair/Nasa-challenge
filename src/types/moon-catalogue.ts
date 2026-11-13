export interface MoonCatalogueRow {
  object: string;
  location: string;
  section: string;
  quantity: number;
  seeBelow: boolean;
  subItem: boolean;
}

export interface MoonCatalogueStats {
  lineCount: number;
  directObjectCount: number;
  bracketQuantitySum: number;
  displayedCount: number;
  sourcePdf: string;
  generatedFrom: string;
}
