import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

export async function GET() {
  const filePath = path.join(process.cwd(), 'app', 'game', 'preposition', 'prepositions.xlsx');

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

    const items = json.map((row, idx) => ({
      id: idx + 1,
      word: String(row['Từ'] || row['word'] || row['Word'] || '').trim(),
      preposition: String(row['Giới từ'] || row['preposition'] || row['Preposition'] || '').trim().toLowerCase(),
      meaning: String(row['Nghĩa'] || row['meaning'] || row['Meaning'] || '').trim(),
      example: String(row['Ví dụ'] || row['example'] || row['Example'] || '').trim(),
    })).filter(it => it.word && it.preposition);

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    console.error('Error reading prepositions.xlsx:', error);
    return NextResponse.json({ error: 'Failed to read Excel file' }, { status: 500 });
  }
}
