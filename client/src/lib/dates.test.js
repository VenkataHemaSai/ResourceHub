import { describe, it, expect } from 'vitest';
import { formatOrgDate, toOrgUtcIso, getOrgWeekRange } from './dates';

describe('Date Utilities', () => {
  const NEW_YORK_TZ = 'America/New_York';
  const TOKYO_TZ = 'Asia/Tokyo';

  it('should format UTC into the correct timezone', () => {
    // Noon UTC is 7am in NY (Standard Time) or 8am (DST)
    const isoString = '2026-01-15T12:00:00Z'; // Winter (Standard Time)
    expect(formatOrgDate(isoString, NEW_YORK_TZ, 'yyyy-MM-dd HH:mm')).toBe('2026-01-15 07:00');
    
    // Summer (DST)
    const isoSummer = '2026-07-15T12:00:00Z';
    expect(formatOrgDate(isoSummer, NEW_YORK_TZ, 'yyyy-MM-dd HH:mm')).toBe('2026-07-15 08:00');
    
    // Tokyo (UTC+9)
    expect(formatOrgDate(isoString, TOKYO_TZ, 'yyyy-MM-dd HH:mm')).toBe('2026-01-15 21:00');
  });

  it('should convert local date in org timezone back to UTC ISO', () => {
    // User selects 9:00 AM on Jan 15 in New York
    const localDate = new Date('2026-01-15T09:00:00');
    const isoString = toOrgUtcIso(localDate, NEW_YORK_TZ);
    
    // 9 AM NY -> 14:00 UTC
    expect(isoString).toBe('2026-01-15T14:00:00.000Z');
  });

  it('should correctly compute week boundaries in a specific timezone', () => {
    const isoString = '2026-01-15T12:00:00Z'; // Thursday
    const range = getOrgWeekRange(isoString, NEW_YORK_TZ);
    
    // NY week starts Monday Jan 12 at 00:00 NY time -> Jan 12 05:00 UTC
    expect(range.start).toBe('2026-01-12T05:00:00.000Z');
    
    // NY week ends Sunday Jan 18 at 23:59:59.999 NY time -> Jan 19 04:59:59.999 UTC
    expect(range.end).toBe('2026-01-19T04:59:59.999Z');
  });
});
