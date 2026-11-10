// Dữ liệu chủ đề + trạng thái bài học 5 bước của English Journey (dùng useReducer).

import type { CommunicationQuestion } from '@/lib/english/communicationBank';

export type Example = { subject: string; action: string; base: string; purpose: string; vi: string; why: string; icon: string };
export type Topic = { id: string; name: string; vi: string; icon: string; example: Example };

export const TOPICS: Topic[] = [
  { id:'daily',name:'Daily Routines',vi:'Sinh hoạt hằng ngày',icon:'🌅',example:{subject:'I',action:'wake up',base:'get dressed',purpose:'go to school',vi:'Tôi thức dậy để mặc quần áo đi học.',why:'Getting dressed helps me get ready for school.',icon:'🎒'} },
  { id:'school',name:'School Activities',vi:'Hoạt động ở trường',icon:'🏫',example:{subject:'We',action:'read',base:'learn',purpose:'new words',vi:'Chúng mình đọc để học từ mới.',why:'Reading helps us learn new words.',icon:'📚'} },
  { id:'health',name:'Health & Hygiene',vi:'Sức khỏe & vệ sinh',icon:'🪥',example:{subject:'I',action:'wash',base:'stay',purpose:'clean',vi:'Tôi rửa tay để giữ sạch sẽ.',why:'Washing my hands helps me stay clean.',icon:'🧼'} },
  { id:'family',name:'Family & Home',vi:'Gia đình & nhà cửa',icon:'🏡',example:{subject:'I',action:'help',base:'make',purpose:'dinner',vi:'Tôi giúp để chuẩn bị bữa tối.',why:'Helping at home makes family life easier.',icon:'🍽️'} },
  { id:'friends',name:'Friends & Social Life',vi:'Bạn bè & giao tiếp',icon:'🧒',example:{subject:'I',action:'share',base:'make',purpose:'my friend happy',vi:'Tôi chia sẻ để làm bạn vui.',why:'Sharing is a kind way to make a friend happy.',icon:'🤝'} },
  { id:'sports',name:'Sports & Playtime',vi:'Thể thao & vui chơi',icon:'⚽',example:{subject:'We',action:'run',base:'stay',purpose:'strong',vi:'Chúng mình chạy để khỏe mạnh.',why:'Running helps us stay strong.',icon:'🏃'} },
  { id:'nature',name:'Nature & Environment',vi:'Thiên nhiên & môi trường',icon:'🌳',example:{subject:'We',action:'plant',base:'help',purpose:'the Earth',vi:'Chúng mình trồng cây để giúp Trái Đất.',why:'Planting trees helps the Earth.',icon:'🌱'} },
  { id:'food',name:'Shopping & Food',vi:'Mua sắm & đồ ăn',icon:'🍎',example:{subject:'I',action:'eat',base:'stay',purpose:'healthy',vi:'Tôi ăn để khỏe mạnh.',why:'Eating fruit helps me stay healthy.',icon:'🍓'} },
  { id:'transport',name:'Transport & Safety',vi:'Đi lại & an toàn',icon:'🚦',example:{subject:'I',action:'look',base:'stay',purpose:'safe',vi:'Tôi nhìn trước khi qua đường để an toàn.',why:'Looking both ways helps me stay safe.',icon:'🚸'} },
  { id:'hobbies',name:'Hobbies & Creativity',vi:'Sở thích & sáng tạo',icon:'🎨',example:{subject:'I',action:'draw',base:'show',purpose:'my ideas',vi:'Tôi vẽ để thể hiện ý tưởng.',why:'Drawing helps me show my ideas.',icon:'🖍️'} },
];

export const TOPIC_ART: Record<string, string> = {
  daily: 'alarm-clock', school: 'school', health: 'soap', family: 'house-with-garden', friends: 'grinning-face-with-smiling-eyes',
  sports: 'soccer-ball', nature: 'seedling', food: 'red-apple', transport: 'bus', hobbies: 'artist-palette',
};
export const EXAMPLE_ART: Record<string, string> = {
  daily: 'backpack', school: 'books', health: 'soap', family: 'bowl-with-spoon', friends: 'grinning-face-with-smiling-eyes',
  sports: 'person-running', nature: 'deciduous-tree', food: 'red-apple', transport: 'bus', hobbies: 'artist-palette',
};
export const STEP_ART: Record<string, string> = {
  Think: 'light-bulb', Connect: 'speech-balloon', Build: 'puzzle-piece', Shadowing: 'speaking-head', Apply: 'star',
};
export const STEPS = [
  { en: 'Think', vi: '1. Khắc sâu (Imprint)' },
  { en: 'Connect', vi: '2. Phản xạ ý' },
  { en: 'Build', vi: '3. Thay biến số & Ghép' },
  { en: 'Shadowing', vi: '4. Nhịp & Đo ΔT' },
  { en: 'Apply', vi: '5. Boss Battle' },
];

export const CHALLENGE_SECONDS = 3;

/** Dữ liệu đã tính sẵn cho câu đang học — truyền xuống từng bước. */
export type LessonData = {
  topic: Topic;
  bankQuestion: CommunicationQuestion | null;
  answer: string;
  actionClause: string;
  reasonClause: string;
  translation: string;
  answerIndex: number;
  options: string[];
  words: string[];
};

const exampleSentence = (e: Example) => `${e.subject} ${e.action} to ${e.base} ${e.purpose}.`;

export function buildLesson(topic: Topic, topicBank: CommunicationQuestion[], questionIndex: number): LessonData {
  const e = topic.example;
  const bankQuestion = topicBank[questionIndex] ?? null;
  const answer = bankQuestion?.sentence ?? exampleSentence(e);
  const answerIndex = bankQuestion ? bankQuestion.number % 3 : 0;

  const tokens = answer.replace(/[.!?]+$/, '').split(/\s+/);
  const offset = tokens.length > 1 ? ((bankQuestion?.number ?? 2) % (tokens.length - 1)) + 1 : 0;
  const words = [...tokens.slice(offset), ...tokens.slice(0, offset)];

  let options: string[];
  if (!bankQuestion) {
    options = [e.why, `Because ${e.action} is fun.`, `Because ${e.purpose} is a person.`];
  } else {
    const distractors = [...new Set(topicBank.filter((item) => item.number !== bankQuestion.number).map((item) => item.reason).filter((item) => item !== bankQuestion.reason))];
    options = new Array<string>(3);
    options[answerIndex] = bankQuestion.reason;
    let next = 0;
    for (let i = 0; i < options.length; i++) if (i !== answerIndex) options[i] = distractors[next++] ?? e.why;
  }

  return {
    topic,
    bankQuestion,
    answer,
    actionClause: bankQuestion?.action ?? `${e.subject} ${e.action}`,
    reasonClause: bankQuestion?.reason ?? `to ${e.base} ${e.purpose}.`,
    translation: bankQuestion?.translation ?? e.vi,
    answerIndex,
    options,
    words,
  };
}

// ---------------------------------------------------------------------------
// Trạng thái bài học
// ---------------------------------------------------------------------------

export type LessonState = {
  active: number;
  questionIndex: number;
  step: number;
  mode: 'learn' | 'challenge';
  choice: number | null;
  reviewed: boolean;
  challengeStarted: boolean;
  seconds: number;
  placed: number[];
};

export type LessonAction =
  | { type: 'selectTopic'; index: number }
  | { type: 'nextQuestion'; total: number }
  | { type: 'goStep'; step: number }
  | { type: 'setMode'; mode: LessonState['mode'] }
  | { type: 'startChallenge' }
  | { type: 'tick' }
  | { type: 'answer'; index: number }
  | { type: 'pickSlot'; index: number }
  | { type: 'place'; index: number }
  | { type: 'clearPlaced' };

const freshStep = { choice: null, reviewed: false, challengeStarted: false, seconds: CHALLENGE_SECONDS, placed: [] as number[] };

export const initialLesson: LessonState = { active: 0, questionIndex: 0, step: 0, mode: 'learn', ...freshStep };

export function lessonReducer(state: LessonState, action: LessonAction): LessonState {
  switch (action.type) {
    case 'selectTopic':
      return { ...state, ...freshStep, active: ((action.index % TOPICS.length) + TOPICS.length) % TOPICS.length, questionIndex: 0, step: 0 };
    case 'nextQuestion':
      return { ...state, ...freshStep, questionIndex: (state.questionIndex + 1) % Math.max(action.total, 1), step: 0 };
    case 'goStep':
      return { ...state, ...freshStep, step: Math.max(0, Math.min(STEPS.length - 1, action.step)) };
    case 'setMode':
      return { ...state, mode: action.mode, challengeStarted: false, reviewed: false, choice: null, seconds: CHALLENGE_SECONDS };
    case 'startChallenge':
      return { ...state, mode: 'challenge', choice: null, reviewed: false, challengeStarted: true, seconds: CHALLENGE_SECONDS };
    case 'tick': {
      if (!state.challengeStarted || state.reviewed || state.seconds <= 0) return state;
      const seconds = state.seconds - 1;
      return seconds === 0 ? { ...state, seconds, reviewed: true, choice: null } : { ...state, seconds };
    }
    case 'answer':
      return { ...state, choice: action.index, reviewed: true, challengeStarted: false };
    case 'pickSlot':
      return { ...state, choice: action.index };
    case 'place':
      return state.placed.includes(action.index) ? state : { ...state, placed: [...state.placed, action.index] };
    case 'clearPlaced':
      return { ...state, placed: [] };
  }
}
