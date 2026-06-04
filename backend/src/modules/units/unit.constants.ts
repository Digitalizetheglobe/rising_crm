export const UNIT_TYPES = [
    '1RK',
    '1BHK',
    '1.5BHK',
    '2BHK',
    '2.5BHK',
    '3BHK',
    '3.5BHK',
    '4BHK',
    '4+BHK',
    'Penthouse',
    'Studio',
    'Villa',
    'Plot',
    'Commercial',
    'Office',
    'Shop',
  ] as const;
  
  export type UnitType = (typeof UNIT_TYPES)[number];
  
  export const UNIT_STATUSES = ['Available', 'Booked', 'Sold'] as const;
  export type UnitStatus = (typeof UNIT_STATUSES)[number];
  
  export const UNIT_FACINGS = [
    'North',
    'South',
    'East',
    'West',
    'North-East',
    'North-West',
    'South-East',
    'South-West',
  ] as const;
  
  export type UnitFacing = (typeof UNIT_FACINGS)[number];