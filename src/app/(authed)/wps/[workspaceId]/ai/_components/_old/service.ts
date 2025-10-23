import z from 'zod';

const RatingLevels = ['VERY_LOW', 'LOW', 'NOMINAL', 'HIGH', 'VERY_HIGH', 'EXTRA_HIGH'] as const;
const ZRatingLevel = z.enum(RatingLevels);
export type RatingLevel = z.infer<typeof ZRatingLevel>;
export const isRatingLevel = (value: string): value is RatingLevel => {
  return RatingLevels.includes(value as RatingLevel);
};

// Software Scale Drivers
const ZSoftwareScaleDrivers = z.object({
  PREC: ZRatingLevel, // Precedentedness
  FLEX: ZRatingLevel, // Development Flexibility
  RESL: ZRatingLevel, // Architecture / Risk Resolution
  TEAM: ZRatingLevel, // Team Cohesion
  PMAT: ZRatingLevel, // Process Maturity
});

// Software Cost Drivers Product
const ZSoftwareCostDriversProduct = z.object({
  RELY: ZRatingLevel, // Required Software Reliability
  DATA: ZRatingLevel, // Database Size
  CPLX: ZRatingLevel, // Product Complexity
  RUSE: ZRatingLevel, // Developed for Reusability
  DOCU: ZRatingLevel, // Documentation Match to Life-Cycle Needs
});
// Personnel
const ZSoftwareCostDriversPersonnel = z.object({
  ACAP: ZRatingLevel, // Analyst Capability
  AEXP: ZRatingLevel, // Applications Experience
  PCAP: ZRatingLevel, // Programmer Capability
  VEXP: ZRatingLevel, // Virtual Machine Experience
  LEXP: ZRatingLevel, // Language and Tool Experience
});
// Platform
const ZSoftwareCostDriversPlatform = z.object({
  TIME: ZRatingLevel, // Execution Time Constraint
  STOR: ZRatingLevel, // Main Storage Constraint
  PVOL: ZRatingLevel, // Platform Volatility
});

export const ZCOCOMOSettings = z.object({
  scaleDrivers: ZSoftwareScaleDrivers,
  costDrivers: z.object({
    product: ZSoftwareCostDriversProduct,
    personnel: ZSoftwareCostDriversPersonnel,
    platform: ZSoftwareCostDriversPlatform,
  }),
});

export type COCOMOSettings = z.infer<typeof ZCOCOMOSettings>;

export const defaultCOCOMOSettings: COCOMOSettings = {
  scaleDrivers: {
    PREC: 'NOMINAL',
    FLEX: 'NOMINAL',
    RESL: 'NOMINAL',
    TEAM: 'NOMINAL',
    PMAT: 'NOMINAL',
  },
  costDrivers: {
    product: {
      RELY: 'NOMINAL',
      DATA: 'NOMINAL',
      CPLX: 'NOMINAL',
      RUSE: 'NOMINAL',
      DOCU: 'NOMINAL',
    },
    personnel: {
      ACAP: 'NOMINAL',
      AEXP: 'NOMINAL',
      PCAP: 'NOMINAL',
      VEXP: 'NOMINAL',
      LEXP: 'NOMINAL',
    },
    platform: {
      TIME: 'NOMINAL',
      STOR: 'NOMINAL',
      PVOL: 'NOMINAL',
    },
  },
};
