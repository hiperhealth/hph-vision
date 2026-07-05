import {describe, expect, it} from '@jest/globals';

import {evaluateTriage, getTriageQuestions} from '..';

const createAnswers = (positiveIds: readonly string[]) =>
  getTriageQuestions().map(question => ({
    questionId: question.id,
    value: positiveIds.includes(question.id),
  }));

describe('evaluateTriage', () => {
  it('allows self-test when all answers are negative', () => {
    const answers = createAnswers([]);

    expect(evaluateTriage(answers)).toMatchObject({
      canContinueSelfTest: true,
      recommendation: 'continue',
    });
  });

  it('blocks self-test on red flags', () => {
    const answers = createAnswers(['sudden-vision-loss']);

    expect(evaluateTriage(answers)).toMatchObject({
      canContinueSelfTest: false,
      recommendation: 'urgentCare',
    });
  });

  it('blocks self-test on eye pain', () => {
    const answers = createAnswers(['eye-pain']);

    expect(evaluateTriage(answers)).toMatchObject({
      canContinueSelfTest: false,
      recommendation: 'urgentCare',
    });
  });

  it('blocks self-test on flashes-or-floaters', () => {
    const answers = createAnswers(['flashes-or-floaters']);

    expect(evaluateTriage(answers)).toMatchObject({
      canContinueSelfTest: false,
      recommendation: 'urgentCare',
    });
  });

  it('blocks self-test on double-vision', () => {
    const answers = createAnswers(['double-vision']);

    expect(evaluateTriage(answers)).toMatchObject({
      canContinueSelfTest: false,
      recommendation: 'seekProfessionalCare',
    });
  });

  it('blocks self-test on recent-eye-trauma', () => {
    const answers = createAnswers(['recent-eye-trauma']);

    expect(evaluateTriage(answers)).toMatchObject({
      canContinueSelfTest: false,
      recommendation: 'urgentCare',
    });
  });

  it('blocks self-test on severe-redness', () => {
    const answers = createAnswers(['severe-redness']);

    expect(evaluateTriage(answers)).toMatchObject({
      canContinueSelfTest: false,
      recommendation: 'seekProfessionalCare',
    });
  });

  it('blocks self-test on known-glaucoma', () => {
    const answers = createAnswers(['known-glaucoma']);

    expect(evaluateTriage(answers)).toMatchObject({
      canContinueSelfTest: false,
      recommendation: 'seekProfessionalCare',
    });
  });

  it('blocks self-test on diabetes-related-risk', () => {
    const answers = createAnswers(['diabetes-related-risk']);

    expect(evaluateTriage(answers)).toMatchObject({
      canContinueSelfTest: false,
      recommendation: 'seekProfessionalCare',
    });
  });

  it('blocks self-test on recent-eye-surgery', () => {
    const answers = createAnswers(['recent-eye-surgery']);

    expect(evaluateTriage(answers)).toMatchObject({
      canContinueSelfTest: false,
      recommendation: 'seekProfessionalCare',
    });
  });

  it('recommends urgent care when urgent and non-urgent red flags are present', () => {
    const answers = createAnswers([
      'eye-pain',
      'known-glaucoma',
    ]);

    expect(evaluateTriage(answers)).toMatchObject({
      canContinueSelfTest: false,
      recommendation: 'urgentCare',
    });
  });

  it('recommends professional care when multiple non-urgent red flags are present', () => {
    const answers = createAnswers([
      'known-glaucoma',
      'diabetes-related-risk',
    ]);

    const result = evaluateTriage(answers);

    expect(result).toMatchObject({
      canContinueSelfTest: false,
      recommendation: 'seekProfessionalCare',
    });

    expect(result.redFlags).toEqual(
      expect.arrayContaining([
        'known_glaucoma',
        'diabetes_related_risk',
      ]),
    );
  });

  it('recommends urgent care when multiple urgent red flags are present', () => {
    const answers = createAnswers([
      'eye-pain',
      'sudden-vision-loss',
    ]);

    expect(evaluateTriage(answers)).toMatchObject({
      canContinueSelfTest: false,
      recommendation: 'urgentCare',
    });
  });

  it('recommends urgent care when urgent and multiple non-urgent red flags are present', () => {
    const answers = createAnswers([
      'eye-pain',
      'known-glaucoma',
      'diabetes-related-risk',
    ]);

    expect(evaluateTriage(answers)).toMatchObject({
      canContinueSelfTest: false,
      recommendation: 'urgentCare',
    });
  });
});