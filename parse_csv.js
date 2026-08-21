import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const timetableDir = path.join(__dirname, 'timetable');
const outputJson = path.join(__dirname, 'src', 'data', 'timetable.json');

const files = fs.readdirSync(timetableDir).filter(f => f.endsWith('.csv'));
const allClasses = [];

function cleanTime(str) {
    if (!str) return '';
    return str.replace(/\s+/g, '').replace('to', '-').replace(/\n.*/, '');
}

function parseCSV(text) {
    let lines = [];
    let currentLine = [];
    let currentCell = '';
    let insideQuote = false;

    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char === '"') {
            insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
            currentLine.push(currentCell.trim());
            currentCell = '';
        } else if ((char === '\n' || char === '\r') && !insideQuote) {
            if (char === '\r' && text[i+1] === '\n') {
                i++;
            }
            currentLine.push(currentCell.trim());
            lines.push(currentLine);
            currentLine = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    if (currentCell !== '' || currentLine.length > 0) {
        currentLine.push(currentCell.trim());
        lines.push(currentLine);
    }
    return lines;
}

files.forEach(file => {
    const filePath = path.join(timetableDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const rows = parseCSV(content).filter(r => r.length > 0 && r.some(c => c));

    let department = 'CE';
    let division = '1';
    let year = 'Unknown';
    let semMatch = file.match(/Sem\s*(\d)/i);
    if (semMatch) {
        const sem = parseInt(semMatch[1]);
        if (sem === 3) year = '2nd Year';
        if (sem === 5) year = '3rd Year';
        if (sem === 7) year = '4th Year';
        if (sem === 1) year = '1st Year';
    }
    let divMatch = file.match(/Div(?:ison)?(?:_|\s)*(\d+)/i);
    if (divMatch) {
        division = divMatch[1];
    }

    const facultyMap = {};
    const subjectMap = {};
    let isLookup = false;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] && row[0].includes('Faculty Abbr.')) {
            isLookup = true;
            continue;
        }
        if (isLookup) {
            if (row[0] && row[2]) facultyMap[row[0]] = row[2];
            if (row[5] && row[7]) subjectMap[row[5]] = row[7];
        }
    }

    let timeSlots = [];
    let currentDay = '';

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] && row[0].includes('Faculty Abbr.')) break;
        
        if (row[0] === 'Day' || (row[1] && row[1].includes('08:00 to 08:55'))) {
            timeSlots = row.map(c => cleanTime(c));
            continue;
        }

        if (row[0] && ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(row[0])) {
            currentDay = row[0];
        } else if (row[0] === '') {
            // retain currentDay
        } else {
            currentDay = '';
        }

        if (!currentDay) continue;

        for (let j = 1; j < row.length; j++) {
            const cell = row[j];
            if (!cell || cell === 'SHORT BREAK' || cell === 'LUNCH BREAK' || cell === 'MINOR') continue;

            const entries = cell.split('\n');
            for (let entry of entries) {
                entry = entry.trim();
                if(!entry) continue;

                let subject = entry;
                let room = 'Unknown';
                let faculty = 'Unknown';
                let type = 'L';

                // format: G1G2 (24CS301T) F1-304, RAGUP-L
                const match = entry.match(/^(.*?)\s*\((.*?)\)\s*(.*?),\s*(.*?)-(.*)$/);
                if (match) {
                    const [_, groups, subCode, rm, facCode, t] = match;
                    subject = subjectMap[subCode] || subCode;
                    room = rm;
                    faculty = facultyMap[facCode] || facCode;
                    type = t;
                }

                if (timeSlots[j]) {
                    const times = timeSlots[j].split('-');
                    let start = times[0] ? times[0].trim() : '';
                    let end = times[1] ? times[1].trim() : '';

                    allClasses.push({
                        id: `${department.toLowerCase()}-div${division}-${currentDay.toLowerCase()}-${start.replace(/[:\.]/g, '')}-${Math.random().toString(36).substring(7)}`,
                        department,
                        division,
                        year,
                        day: currentDay,
                        startTime: start,
                        endTime: end,
                        subject,
                        room,
                        faculty,
                        type,
                        originalText: entry
                    });
                }
            }
        }
    }
});

fs.writeFileSync(outputJson, JSON.stringify(allClasses, null, 2));
console.log('Successfully generated timetable.json with ' + allClasses.length + ' classes.');
