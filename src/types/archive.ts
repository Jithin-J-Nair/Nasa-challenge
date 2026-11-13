export type CelestialBody = 'moon' | 'mars' | 'deep';
export type ArtifactStatus = 'derelict' | 'active' | 'silent' | 'lost' | 'destroyed';
export type Specification = readonly [label: string, value: string];
export type AuditStatus = 'complete' | 'withheld';

export interface ClaimAudit {
  summary: string;
  specificationRows: string[];
  discoveries: string[];
  transmission: string;
}

export interface ArtifactSeed {
  id: string;
  n: string;
  m: string;
  ag: string;
  b: CelestialBody;
  y: number;
  st: ArtifactStatus;
  sch: string;
  one: string;
  spec: Specification[];
  voice: string;
  disc: string[];
  last: string;
  tags: string;
  feat?: boolean;
  lat?: number;
  lon?: number;
  site?: string;
  orbit?: string;
}

export interface Artifact extends ArtifactSeed {
  claimsAudit: ClaimAudit;
  source: string;
  sourceLabel: string;
  verifiedByNASA: boolean;
  auditStatus: AuditStatus;
  story: string;
  image: string;
  imageCredit: string;
  imageSource: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  imageSpecific: boolean;
  imageMission: boolean;
  imagePlaceholder: boolean;
}

export interface AuditReplacement {
  summary: string;
  specs: Specification[];
  lat?: number;
  lon?: number;
  site?: string;
}

export interface ImageMetadata {
  path: string;
  credit: string;
  source: string;
  alt: string;
}

export interface LedgerItem {
  ic: string;
  t: string;
  y: string;
  p: string;
}

export type ScienceEntry = readonly [id: string, title: string, period: string, claim: string];
