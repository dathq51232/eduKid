import assert from 'node:assert/strict';
import { studentSlide } from '../src/lib/deck/fromIdeas';
import { normalizeDeck, SW, SH, type El } from '../src/lib/deck/types';
import { questionSegments } from '../src/lib/speech';

const phase = { n: 'Luyện tập', c: '#2563eb' };
const inBounds = (e: El) => e.x >= 0 && e.y >= 0 && e.x + e.w <= SW && e.y + e.h <= SH;
const intersects = (a: El, b: El) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const make = (spec: Parameters<typeof studentSlide>[0], offset = 0) => studentSlide(spec, phase, 1, [], 'class', offset);

const quiz = make({ q: '2 + 3 = ?', quiz: { opts: ['4', '5', '6', '7'], a: 1 } });
const quizEl = quiz.els.find((e) => e.kind === 'quiz');
assert.ok(quizEl && quizEl.kind === 'quiz');
assert.ok(!quiz.els.some((e) => e.kind === 'text' && e.text === quizEl.q), 'quiz question should only render once');

const contextualQuiz = make({ q: 'Nên hay không nên?', cards: ['Bạn mới chuyển đến.'], quiz: { opts: ['Nên', 'Không nên'], a: 0 } });
const prompt = contextualQuiz.els.find((e) => e.kind === 'text' && e.text === 'Nên hay không nên?');
const contextualQuizEl = contextualQuiz.els.find((e) => e.kind === 'quiz');
assert.ok(prompt && contextualQuizEl && !intersects(prompt, contextualQuizEl), 'quiz context and question must not overlap');

const sort = make({ q: 'Xếp các số từ bé đến lớn!', sort: ['1', '2', '3', '4'] });
const sortEl = sort.els.find((e) => e.kind === 'sort');
const sortPrompt = sort.els.find((e) => e.kind === 'text' && e.text === 'Xếp các số từ bé đến lớn!');
assert.ok(sortEl && sortPrompt && !intersects(sortEl, sortPrompt), 'sort prompt and tiles must not overlap');

const drop = make({
  q: 'Kéo các vật vào đúng ô.',
  drop: {
    zones: [{ label: 'Ô 1', ok: [0] }, { label: 'Ô 2', ok: [1] }, { label: 'Ô 3', ok: [2] }, { label: 'Ô 4', ok: [3] }],
    items: [{ text: 'A' }, { text: 'B' }, { text: 'C' }, { text: 'D' }],
  },
  reveal: 'Đáp án mẫu',
});
const zones = drop.els.filter((e) => e.kind === 'drop');
const draggables = drop.els.filter((e) => e.drag);
assert.equal(zones.length, 4);
assert.ok(zones.every(inBounds), 'drop zones must stay inside the slide');
assert.ok(draggables.every(inBounds), 'drag items must stay inside the slide');
assert.ok(zones.every((z, i) => zones.slice(i + 1).every((other) => !intersects(z, other))), 'drop zones must not overlap');
assert.ok(zones.every((z) => draggables.every((item) => !intersects(z, item))), 'drop zones and draggable items must not overlap');
const reveal = drop.els.find((e) => e.kind === 'text' && e.text === 'Đáp án mẫu');
assert.ok(reveal && inBounds(reveal) && draggables.every((item) => !intersects(reveal, item)), 'answer reveal must stay visible below draggable items');

const layouts = Array.from({ length: 4 }, (_, i) => make({ q: 'Question', sort: ['a', 'b'] }, i));
assert.equal(new Set(layouts.map((s) => s.els.find((e) => e.kind === 'text' && e.text === 'Question')?.x)).size, 4, 'slides in one activity should vary their layout');

const legacy = normalizeDeck({ v: 1, title: 'Quiz cũ', slides: [{ id: 'legacy', bg: 'white', trans: 'fade', notes: '', anims: [], els: [{ id: 'q', kind: 'quiz', x: 100, y: 100, w: 1000, h: 600, rot: 0, q: 'Câu cũ?', opts: ['Có', 'Không'], a: 0, cols: 2 }] }] });
const reopenedLegacy = normalizeDeck(JSON.parse(JSON.stringify(legacy)));
const legacyQuiz = reopenedLegacy.slides[0].els.find((e) => e.kind === 'quiz');
assert.ok(legacyQuiz && legacyQuiz.kind === 'quiz' && legacyQuiz.opts[0] === 'Có', 'legacy string quiz options should survive save/open');

const imageQuiz = normalizeDeck({ v: 1, title: 'Quiz ảnh', src: { subject: 'tieng-anh' }, slides: [{ id: 'image', bg: 'white', trans: 'fade', notes: '', anims: [], els: [{ id: 'q', kind: 'quiz', x: 100, y: 100, w: 1000, h: 600, rot: 0, q: 'Choose an animal', opts: [{ text: 'Cat', img: '/assets/cat.png', imageAsset: true }, { text: 'Dog', img: '/assets/dog.png', imageAsset: true }], a: 0, cols: 2 }] }] });
const reopenedImage = normalizeDeck(JSON.parse(JSON.stringify(imageQuiz)));
const imageQuizEl = reopenedImage.slides[0].els.find((e) => e.kind === 'quiz');
assert.ok(imageQuizEl && imageQuizEl.kind === 'quiz' && typeof imageQuizEl.opts[0] !== 'string' && imageQuizEl.opts[0].imageAsset, 'image quiz assets and subject should survive save/open');
assert.equal(reopenedImage.src?.subject, 'tieng-anh');

const english = questionSegments('Choose the correct answer.', ['cat', 'dog'], 'tieng-anh');
assert.ok(english.some((s) => s.text.includes('The options are:') && s.lang === 'en'), 'English quiz guidance should be spoken in English');
assert.ok(english.every((s) => s.lang === 'en'), 'English-only prompt and options should remain English');

console.log('Slide layout, quiz compatibility, image quiz save/open, and TTS checks passed.');
