import Papa from 'papaparse';
import { timeToMinutes } from './timetableEngine';

export interface ParsedRow {
  department?: string;
  batch?: string;
  division?: string;
  group_name?: string;
  day?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  time_range?: string;
  subject?: string;
  teacher?: string;
  room?: string;
  notes?: string;
  _source_row_number: number;
}

export interface ValidationResult {
  validRows: ParsedRow[];
  invalidRows: { row: ParsedRow; errors: string[] }[];
}

export function parseCsvText(csvText: string): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.map((row: any, index) => ({
          ...row,
          _source_row_number: index + 1
        }));
        resolve(rows);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

export function parseMatrixCsv(csvText: string, targetSubGroup?: string): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as string[][];
        const parsedRows: ParsedRow[] = [];
        
        // Find the header row that starts with 'Day'
        let headerRowIndex = -1;
        for (let i = 0; i < data.length; i++) {
          if (data[i][0] && data[i][0].trim().toLowerCase() === 'day') {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          reject(new Error("Could not find the 'Day' header row. Is this a valid PDEU Matrix CSV?"));
          return;
        }

        const timeHeaders = data[headerRowIndex];
        const timeSlots: Array<{ start: string, end: string } | null> = [];

        // Parse time columns (start from index 1)
        for (let i = 1; i < timeHeaders.length; i++) {
          let header = timeHeaders[i];
          if (!header) {
            timeSlots.push(null);
            continue;
          }

          // Clean up newlines and spaces e.g. "08:00 to 08:55 \n(Minor Slot)" -> "08:00 to 08:55"
          header = header.split('\n')[0].trim();
          
          // Regex to capture "8.00 to 8.55" or "14:10 to 15:05"
          const timeRegex = /([0-9]{1,2})[:.]([0-9]{2})\s*to\s*([0-9]{1,2})[:.]([0-9]{2})/;
          const match = header.match(timeRegex);
          if (match) {
            let startH = parseInt(match[1]);
            const startM = match[2];
            let endH = parseInt(match[3]);
            const endM = match[4];

            // PM Correction logic: if hour is 1-7, it's PM (13-19)
            // Assuming classes start at 8 AM earliest.
            if (startH < 8) startH += 12;
            if (endH < 8) endH += 12;

            const startStr = `${startH.toString().padStart(2, '0')}:${startM}`;
            const endStr = `${endH.toString().padStart(2, '0')}:${endM}`;
            
            timeSlots.push({ start: startStr, end: endStr });
          } else {
            timeSlots.push(null); // Unknown format
          }
        }

        let currentDay = '';

        for (let i = headerRowIndex + 1; i < data.length; i++) {
          const row = data[i];
          
          // Stop parsing when we hit the Faculty Abbr. section
          if (row[0] && row[0].includes('Faculty Abbr')) break;

          const dayCellRaw = row[0] ? row[0].trim() : '';
          const dayCellLower = dayCellRaw.toLowerCase();
          const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          if (dayCellRaw && validDays.includes(dayCellLower)) {
            // Capitalize first letter
            currentDay = dayCellLower.charAt(0).toUpperCase() + dayCellLower.slice(1);
          }

          if (!currentDay) continue;

          for (let j = 1; j < row.length; j++) {
            const cell = row[j] ? row[j].trim() : '';
            const timeSlot = timeSlots[j - 1];

            if (!cell || !timeSlot || cell.toUpperCase().includes('BREAK') || cell.toUpperCase() === 'MINOR') {
              continue;
            }

            // Target format: "G1G2 (24CS203T) F-503, ADSH-L"
            // Make regex looser: comma optional, spaces optional
            const cellRegex = /^([^\s]+)\s*\(([^)]+)\)\s*([^,]+),?\s*([^-]+)-?(\w)?$/;
            const match = cell.match(cellRegex);
            
            if (match) {
              const groups = match[1]; // G1G2 or G1
              const subjectCode = match[2];
              const room = match[3] ? match[3].trim() : '';
              const faculty = match[4] ? match[4].trim() : '';
              const type = match[5] || '';

              // Filter sub-group if provided
              if (targetSubGroup && targetSubGroup.trim() !== '') {
                // If the target is G1, and the cell is G2, skip.
                // If the cell is G1G2, include it.
                if (!groups.includes(targetSubGroup.trim())) {
                  continue; // Skip this cell
                }
              }

              parsedRows.push({
                day: currentDay,
                start_time: timeSlot.start,
                end_time: timeSlot.end,
                subject: `${subjectCode}${type ? ` (${type})` : ''}`, 
                teacher: faculty,
                room: room,
                notes: groups,
                _source_row_number: i + 1
              });
            } else {
              // Fallback for non-standard cells
              parsedRows.push({
                day: currentDay,
                start_time: timeSlot.start,
                end_time: timeSlot.end,
                subject: cell,
                _source_row_number: i + 1
              });
            }
          }
        }

        resolve(parsedRows);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

export function validateTimetableRows(rows: ParsedRow[]): ValidationResult {
  const validRows: ParsedRow[] = [];
  const invalidRows: { row: ParsedRow; errors: string[] }[] = [];

  for (const row of rows) {
    const errors: string[] = [];

    // Check Day/Date
    if (!row.day && !row.date) {
      errors.push('Missing day or date');
    }

    // Time handling
    let start = row.start_time;
    let end = row.end_time;

    if (!start && !end && row.time_range) {
      const parts = row.time_range.split('-');
      if (parts.length === 2) {
        start = parts[0].trim();
        end = parts[1].trim();
      }
    }

    if (!start) errors.push('Missing start time');
    if (!end) errors.push('Missing end time');

    if (start && end) {
      const startMin = timeToMinutes(start);
      const endMin = timeToMinutes(end);
      if (endMin <= startMin) {
        errors.push('End time must be after start time');
      }
    }

    if (!row.subject) {
      errors.push('Missing subject');
    }

    if (errors.length > 0) {
      invalidRows.push({ row, errors });
    } else {
      // Normalize time fields if we extracted them from time_range
      validRows.push({
        ...row,
        start_time: start,
        end_time: end
      });
    }
  }

  return { validRows, invalidRows };
}
