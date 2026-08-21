import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.join(__dirname, 'timetable', 'B.Tech_CE_2024_Sem 5_Div_1.csv');

const content = fs.readFileSync(file, 'utf-8');
const lines = content.split('\n').map(l => l.trim()).filter(l => l);

console.log('Lines 6 to 10:');
lines.slice(5, 10).forEach(l => console.log(l));
