import {TRIAGE_QUESTIONS} from './questions';
import type {TriageAnswer, TriageResult} from './types';

export const evaluateTriage = (answers: TriageAnswer[]): TriageResult => {
  const answerMap = new Map(
    answers.map(answer => [answer.questionId, answer.value]),
  );
  const unansweredQuestionIds = TRIAGE_QUESTIONS.filter(
    question => !answerMap.has(question.id),
  ).map(question => question.id);

  const positiveQuestions = TRIAGE_QUESTIONS.filter(
    question => answerMap.get(question.id) === true,
  );
  const blockingQuestions = positiveQuestions.filter(
    question => question.blocksSelfTestOnPositive,
  );
  const urgentQuestions = positiveQuestions.filter(
    question => question.urgentOnPositive,
  );
  const redFlags = blockingQuestions.map(question => question.category);

  const canContinueSelfTest =
    redFlags.length === 0 && unansweredQuestionIds.length === 0;
  const recommendation = canContinueSelfTest
    ? 'continue'
    : urgentQuestions.length > 0
      ? 'urgentCare'
      : 'seekProfessionalCare';

  return {
    canContinueSelfTest,
    redFlags,
    recommendation,
    unansweredQuestionIds,
    warnings: [
      ...redFlags.map(
        category =>
          ({
            code: `triage.${category}`,
            message:
              'A safety triage answer indicates professional evaluation is recommended.',
            severity: urgentQuestions.some(
              question => question.category === category,
            )
              ? 'critical'
              : 'warning',
            source: 'triage',
          }) as const,
      ),
      ...unansweredQuestionIds.map(
        questionId =>
          ({
            code: 'triage.unanswered_question',
            message: `Triage question ${questionId} was not answered.`,
            severity: 'warning',
            source: 'triage',
          }) as const,
      ),
    ],
  };
};
