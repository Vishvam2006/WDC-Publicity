import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseCSV = (text) => {
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
};

const file = path.join(__dirname, 'timetable', 'B.Tech_CE_2024_Sem 5_Div_5.csv');
const content = fs.readFileSync(file, 'utf8');
const rows = parseCSV(content);
const header = rows.find(r => r[0] === 'Day');
console.log('Header length:', header.length);
header.forEach((c, i) => console.log(i + ': ' + c));
const wed = rows.find(r => r[0] === 'Wednesday');
console.log('Wed length:', wed.length);
wed.forEach((c, i) => console.log(i + ': ' + c));
