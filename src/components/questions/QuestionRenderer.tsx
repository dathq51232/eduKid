'use client';

import type { AnswerValue, Question } from '@/lib/types';
import ChoiceQuestion from './ChoiceQuestion';
import FillBlankQuestion from './FillBlankQuestion';
import FillBlanksQuestion from './FillBlanksQuestion';
import MatchingQuestion from './MatchingQuestion';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import OrderingQuestion from './OrderingQuestion';
import TrueFalseTableQuestion from './TrueFalseTableQuestion';
import { toolFor, toolImg } from '@/lib/milo-tools';
import '@/styles/qz.css';

type Props = {
  question: Question;
  answer: AnswerValue;
  onAnswerChange: (value: AnswerValue) => void;
  isSubmitted: boolean;
  isCorrect: boolean;
  onSubmit?: () => void;
};

// Chọn giao diện theo loại câu hỏi. Dùng chung cho trang làm bài và nút "Xem thử" của trang quản trị.
export default function QuestionRenderer(props: Props) {
  const tool = toolFor(props.question.type);
  const body = renderBody(props);
  if (!tool) return body;
  // “Đồ nghề của Milo”: tên + biểu tượng của dạng câu, để em quen thao tác (docs/BAN-SAC-EDUCHAINKIDS.md mục 5)
  return (
    <>
      <p className="qz-tool" title={`${tool.name}: ${tool.hint}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- hình 3D nhỏ từ CDN */}
        <span className="qz-tool-ic" aria-hidden="true"><img src={toolImg(tool.code)} alt="" width={20} height={20} decoding="async" onError={(e) => { e.currentTarget.replaceWith(tool.icon); }} /></span>
        <b>{tool.name}</b><span className="qz-tool-hint">{tool.hint}</span>
      </p>
      {body}
    </>
  );
}

function renderBody(props: Props) {
  switch (props.question.type) {
    case 'single_choice':
    case 'true_false':
      return <ChoiceQuestion {...props} />;
    case 'fill_blank':
      return <FillBlankQuestion {...props} />;
    case 'multiple_choice':
      return <MultipleChoiceQuestion {...props} />;
    case 'ordering':
      return <OrderingQuestion {...props} />;
    case 'matching':
      return <MatchingQuestion {...props} />;
    case 'fill_blanks':
      return <FillBlanksQuestion {...props} />;
    case 'true_false_table':
      return <TrueFalseTableQuestion {...props} />;
    default:
      return <p className="unsupported-note">Dạng câu hỏi này chưa được hỗ trợ.</p>;
  }
}
