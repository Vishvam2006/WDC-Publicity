import type { TimetableEntry } from './api';

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  // Handle "09:00", "9:00 AM", etc.
  // For MVP, assuming 24-hour "HH:MM"
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60) + (minutes || 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export interface Interval {
  start_minutes: number;
  end_minutes: number;
  entry?: TimetableEntry;
}

export function detectMasterFreeIntervals(
  masterEntries: TimetableEntry[],
  dayStartMinutes: number = 8 * 60,
  dayEndMinutes: number = 18 * 60
): Interval[] {
  // Sort master entries by start time
  const sorted = [...masterEntries].sort((a, b) => a.start_minutes - b.start_minutes);
  
  const freeIntervals: Interval[] = [];
  let currentStart = dayStartMinutes;

  for (const entry of sorted) {
    if (currentStart < entry.start_minutes) {
      // There's a gap before this entry
      freeIntervals.push({
        start_minutes: currentStart,
        end_minutes: entry.start_minutes
      });
    }
    // Advance currentStart to the end of this class, or keep it if it's already further (overlapping master classes)
    if (currentStart < entry.end_minutes) {
      currentStart = entry.end_minutes;
    }
  }

  if (currentStart < dayEndMinutes) {
    freeIntervals.push({
      start_minutes: currentStart,
      end_minutes: dayEndMinutes
    });
  }

  return freeIntervals;
}

export function findOverlappingPublicClasses(
  freeIntervals: Interval[],
  publicEntries: TimetableEntry[]
): Array<{ freeInterval: Interval, overlappingEntries: TimetableEntry[] }> {
  
  const result: Array<{ freeInterval: Interval, overlappingEntries: TimetableEntry[] }> = [];

  for (const free of freeIntervals) {
    const overlaps = publicEntries.filter(pub => 
      pub.start_minutes < free.end_minutes && pub.end_minutes > free.start_minutes
    );
    
    if (overlaps.length > 0) {
      result.push({
        freeInterval: free,
        overlappingEntries: overlaps
      });
    }
  }

  return result;
}
