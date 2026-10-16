// Đọc file CSV câu hỏi theo mẫu trong docs/soan-cau-hoi.md và chuyển thành bản nháp câu hỏi.

import type { Level } from '@/lib/levels';
import { QUESTION_TYPES, type DbQuestionType } from '@/lib/types';
import { emptyDraft, validateDraft } from './questions';
import type { CatalogForm, CatalogOutcome, QuestionDraft } from './types';

export type CsvLookup = { forms: CatalogForm[]; outcomes: CatalogOutcome[] };

// Bộ đọc CSV nhỏ: hỗ trợ ô có dấu ngoặc kép, dấu phẩy và xuống dòng bên trong ô.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',' || ch === ';' || ch === '\t') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

// Thứ tự cột mặc định khi file không có dòng tiêu đề (đúng như prompt trong tài liệu).
const DEFAULT_COLUMNS = [
  'subject', 'grade', 'book_series', 'semester', 'lesson_title', 'type', 'prompt',
  'option_a', 'option_b', 'option_c', 'option_d', 'answer', 'explanation', 'difficulty', 'skill_code',
  'form_code', 'outcome_code', 'solution', 'time_limit',
];

const TYPE_ALIASES: Record<string, DbQuestionType> = {
  mcq: 'single_choice',
  trac_nghiem: 'single_choice',
  fill_in: 'fill_blank',
  dien: 'fill_blank',
  dung_sai: 'true_false',
  ghep_cap: 'matching',
  sap_xep: 'ordering',
};

export type CsvItem = { line: number; draft: QuestionDraft; errors: string[] };

const split = (v: string) => v.split('|').map((x) => x.trim()).filter(Boolean);

function trueFalse(v: string): string {
  const x = v.trim().toLowerCase();
  if (['đúng', 'dung', 'true', 'd', 'đ', '1'].includes(x)) return 'Đúng';
  if (['sai', 'false', 's', '0'].includes(x)) return 'Sai';
  return v.trim();
}

export function csvToDrafts(text: string, lookup: CsvLookup = { forms: [], outcomes: [] }): CsvItem[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const first = rows[0].map((c) => c.trim().toLowerCase());
  const hasHeader = first.includes('prompt') && first.includes('type');
  const columns = hasHeader ? first : DEFAULT_COLUMNS;
  const body = hasHeader ? rows.slice(1) : rows;

  return body.map((cells, idx) => {
    const get = (name: string) => {
      const i = columns.indexOf(name);
      return i >= 0 ? (cells[i] ?? '').trim() : '';
    };
    const rawType = get('type').toLowerCase();
    const formCode = get('form_code').toUpperCase();
    const outcomeCode = get('outcome_code').toUpperCase();
    const form = formCode ? lookup.forms.find((f) => f.code === formCode) : undefined;
    const outcome = outcomeCode ? lookup.outcomes.find((o) => o.code === outcomeCode) : undefined;
    // Không ghi cột type nhưng có dạng bài: dùng kiểu câu mặc định của dạng bài
    const type = (QUESTION_TYPES as readonly string[]).includes(rawType)
      ? (rawType as DbQuestionType)
      : TYPE_ALIASES[rawType] ?? (!rawType ? form?.default_question_type : undefined);
    const line = idx + (hasHeader ? 2 : 1);
    const lookupErrors = [
      ...(formCode && !form ? [`Không có dạng bài mã "${formCode}" trong môn này.`] : []),
      ...(outcomeCode && !outcome ? [`Không có YCCĐ mã "${outcomeCode}" trong môn này.`] : []),
    ];

    if (!type) {
      return { line, draft: emptyDraft(), errors: [`Loại câu "${get('type')}" không hợp lệ.`] };
    }

    const d = emptyDraft(type);
    d.prompt = get('prompt');
    d.explanation = get('explanation');
    d.solution = get('solution');
    d.formId = form?.id ?? null;
    d.outcomeId = outcome?.id ?? null;
    d.skillCode = get('skill_code');
    // Cấp độ: 1-5, L1-L5 hoặc chữ (làm quen/nhận biết, cơ bản/thông hiểu, vận dụng, thử thách, mở rộng)
    const rawLevel = (get('difficulty') || get('level') || get('cap_do')).toLowerCase().trim();
    const diff = /cơ bản|co ban|thông|thong/.test(rawLevel) ? 2
      : /vận|van/.test(rawLevel) ? 3
      : /thử|thu thach/.test(rawLevel) ? 4
      : /mở|mo rong/.test(rawLevel) ? 5
      : Number(rawLevel.replace(/^l/, ''));
    d.difficulty = ([1, 2, 3, 4, 5].includes(diff) ? diff : 1) as Level;
    // Thời gian (giây), bỏ trống = tự tính
    const rawTime = (get('time_limit') || get('thoi_gian')).replace(/[^0-9]/g, '');
    d.timeLimit = rawTime ? Number(rawTime) : null;
    const options = ['option_a', 'option_b', 'option_c', 'option_d', 'option_e', 'option_f'].map(get).filter(Boolean);
    const answer = get('answer');

    switch (type) {
      case 'single_choice':
        d.options = options;
        d.correct = answer;
        // Cho phép ghi A/B/C/D trong cột answer
        if (/^[a-fA-F]$/.test(answer) && !options.some((o) => o.toLowerCase() === answer.toLowerCase())) {
          d.correct = options['abcdef'.indexOf(answer.toLowerCase())] ?? answer;
        }
        break;
      case 'multiple_choice':
        d.options = options;
        d.correctMany = split(answer);
        break;
      case 'true_false':
        d.correct = trueFalse(answer);
        break;
      case 'fill_blank':
        d.accepted = split(answer);
        break;
      case 'ordering':
        d.order = split(answer);
        break;
      case 'matching':
        d.pairs = split(answer).map((pair) => {
          const [left, ...rest] = pair.split('=');
          return { left: (left ?? '').trim(), right: rest.join('=').trim() };
        });
        break;
    }
    return { line, draft: d, errors: [...lookupErrors, ...validateDraft(d)] };
  });
}
