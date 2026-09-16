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
    if (file.toLowerCase().includes('information and communication technology') || file.toLowerCase().includes('ict')) {
        department = 'ICT';
    } else if (file.toLowerCase().includes('csbs')) {
        department = 'CSBS';
    }

    let division = '1';
    let year = 'Unknown';
    let semMatch = file.match(/Sem\s*(\d)/i);
    let ictMatch = file.match(/(\d)_(\d)\.csv$/i);

    if (semMatch) {
        const sem = parseInt(semMatch[1]);
        if (sem === 1 || sem === 2) year = '1st Year';
        if (sem === 3 || sem === 4) year = '2nd Year';
        if (sem === 5 || sem === 6) year = '3rd Year';
        if (sem === 7 || sem === 8) year = '4th Year';
    } else if (ictMatch) {
        const sem = parseInt(ictMatch[1]);
        if (sem === 1 || sem === 2) year = '1st Year';
        if (sem === 3 || sem === 4) year = '2nd Year';
        if (sem === 5 || sem === 6) year = '3rd Year';
        if (sem === 7 || sem === 8) year = '4th Year';
    }

    let divMatch = file.match(/Div(?:ison)?(?:_|\s)*(\d+)/i);
    if (divMatch) {
        division = divMatch[1];
    } else if (ictMatch) {
        division = ictMatch[2];
    }

    const facultyMap = {};
    const subjectMap = {};
    let isLookup = false;
    let facAbbrIdx = 0, facNameIdx = 2, subAbbrIdx = 5, subNameIdx = 7;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] && row[0].includes('Faculty Abbr.')) {
            isLookup = true;
            let tempFacAbbrIdx = row.findIndex(c => c && c.includes('Faculty Abbr.'));
            let tempFacNameIdx = row.findIndex(c => c && c.includes('Faculty Name'));
            let tempSubAbbrIdx = row.findIndex(c => c && c.includes('Subject Abbr.'));
            let tempSubNameIdx = row.findIndex(c => c && c.includes('Subject Name'));
            
            if (tempFacAbbrIdx !== -1) facAbbrIdx = tempFacAbbrIdx;
            if (tempFacNameIdx !== -1) facNameIdx = tempFacNameIdx;
            if (tempSubAbbrIdx !== -1) subAbbrIdx = tempSubAbbrIdx;
            if (tempSubNameIdx !== -1) subNameIdx = tempSubNameIdx;
            continue;
        }
        if (isLookup) {
            if (row[facAbbrIdx] && row[facNameIdx]) facultyMap[row[facAbbrIdx]] = row[facNameIdx];
            if (row[subAbbrIdx] && row[subNameIdx]) subjectMap[row[subAbbrIdx]] = row[subNameIdx];
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
