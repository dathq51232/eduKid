'use client';

import type { AnswerValue, Question } from '@/lib/types';
import ChoiceQuestion from './ChoiceQuestion';
import FillBlankQuestion from './FillBlankQuestion';
import FillBlanksQuestion from './FillBlanksQuestion';
import MatchingQuestion from './MatchingQuestion';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import OrderingQuestion from './OrderingQuestion';
import TrueFalseTableQuestion from './TrueFalseTableQuestion';

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
