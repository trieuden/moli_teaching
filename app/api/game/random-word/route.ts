import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

const LESSON_DIR = path.join(process.cwd(), 'app', 'game', 'random-word', 'lesson');

export interface LessonMeta {
  id: string;
  name: string;
  fileName: string;
}

// GET /api/game/random-word?action=list  → list lessons
// GET /api/game/random-word?action=load&id=020626 → load lesson words
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') ?? 'list';

  if (action === 'list') {
    try {
      const files = fs.readdirSync(LESSON_DIR).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
      const lessons: LessonMeta[] = files.map(fileName => ({
        id: path.basename(fileName, path.extname(fileName)),
        name: formatLessonName(path.basename(fileName, path.extname(fileName))),
        fileName,
      }));
      return NextResponse.json({ lessons });
    } catch {
      return NextResponse.json({ lessons: [] });
    }
  }

  if (action === 'load') {
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const filePath = path.join(LESSON_DIR, `${id}.xlsx`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    try {
      const buffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const HEADERS = ['Từ', 'Định nghĩa (4 - 6 từ)', 'Loại từ', 'Nghĩa tiếng việt'];
      const words = (json as Record<string, unknown>[])
        .map((row) => ({
          word: String(row[HEADERS[0]] ?? '').trim(),
          definition: String(row[HEADERS[1]] ?? '').trim(),
          type: String(row[HEADERS[2]] ?? '').trim(),
          vn_meaning: String(row[HEADERS[3]] ?? '').trim(),
        }))
        .filter(w => w.word !== '');

      return NextResponse.json({ words, total: words.length });
    } catch (err) {
      console.error('Error reading lesson:', err);
      return NextResponse.json({ error: 'Failed to read lesson' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

function formatLessonName(id: string): string {
  // e.g. "020626" → "Bài 02/06/26"
  if (/^\d{6}$/.test(id)) {
    return `Bài ${id.slice(0, 2)}/${id.slice(2, 4)}/${id.slice(4, 6)}`;
  }
  return id;
}
