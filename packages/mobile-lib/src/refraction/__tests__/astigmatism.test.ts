import {
    normalizeCylinder,
    normalizeAxis,
    normalizeAnswer,
    generateClockDialPrompt,
    generateFanChartPrompt,
    generateLineOrientationPrompt,
    generateJccPrompt,
    isContradictoryAnswer,
    calculateAstigmatismConfidence,
    estimateAxisRange,
    estimateCylinderRange,
    buildReliabilityWarnings,
    AstigmatismAnswer,
    DEFAULT_AXIS_RANGE,
    DEFAULT_CYLINDER_RANGE
} from '../astigmatism';

describe('Astigmatism Primitives', () => {

    describe('normalization', () => {
        it('normalizes cylinder to nearest 0.25 and caps at 0', () => {
            expect(normalizeCylinder(-1.1)).toBe(-1.0);
            expect(normalizeCylinder(-1.3)).toBe(-1.25);
            expect(normalizeCylinder(1.0)).toBe(0);
        });

        it('normalizes axis and handles wrap-around cases', () => {
            expect(normalizeAxis(0)).toBe(180);
            expect(normalizeAxis(181)).toBe(1);
            expect(normalizeAxis(360)).toBe(180);
            expect(normalizeAxis(-10)).toBe(170);
        });

        it('normalizes astigmatism answer object', () => {
            const answer: AstigmatismAnswer = {
                pattern: 'jcc',
                selectedAxis: 190,
                jccAxisA: -5,
                jccAxisB: 185
            };
            const normalized = normalizeAnswer(answer);
            expect(normalized.selectedAxis).toBe(10);
            expect(normalized.jccAxisA).toBe(175);
            expect(normalized.jccAxisB).toBe(5);
        });
    });

    describe('prompt generation', () => {
        it('generates clock dial prompt', () => {
            expect(generateClockDialPrompt()).toEqual([30, 60, 90, 120, 150, 180]);
        });

        it('generates fan chart prompt', () => {
            expect(generateFanChartPrompt()).toHaveLength(18);
            expect(generateFanChartPrompt()[0]).toBe(10);
            expect(generateFanChartPrompt()[17]).toBe(180);
        });

        it('generates line orientation prompt with wrap around', () => {
            expect(generateLineOrientationPrompt([90, 100])).toEqual([85, 95, 105]);
            expect(generateLineOrientationPrompt([5, 15])).toEqual([180, 10, 20]);
        });

        it('generates JCC prompt with wrap around', () => {
            expect(generateJccPrompt([90, 100])).toEqual([50, 140]);
            expect(generateJccPrompt([5, 15])).toEqual([145, 55]);
        });
    });

    describe('axis estimation', () => {
        it('estimates axis range for dial pattern', () => {
            const answer: AstigmatismAnswer = { pattern: 'clockDial', selectedAxis: 90 };
            expect(estimateAxisRange(answer, DEFAULT_AXIS_RANGE)).toEqual([75, 105]);
        });

        it('estimates axis range for line orientation pattern', () => {
            const answer: AstigmatismAnswer = { pattern: 'lineOrientation', selectedAxis: 10 };
            expect(estimateAxisRange(answer, DEFAULT_AXIS_RANGE)).toEqual([1, 25]);
        });

        it('estimates axis range for JCC pattern', () => {
            const answer: AstigmatismAnswer = { pattern: 'jcc', jccPreference: 'A', jccAxisA: 95 };
            expect(estimateAxisRange(answer, [75, 105])).toEqual([90, 100]);
        });

        it('handles contradictory axis range by taking the most recent range', () => {
            const answer: AstigmatismAnswer = { pattern: 'clockDial', selectedAxis: 10 };
            expect(estimateAxisRange(answer, [90, 100])).toEqual([1, 25]);
        });
    });

    describe('cylinder estimation', () => {
        it('estimates cylinder range for fan chart pattern', () => {
            const answer: AstigmatismAnswer = { pattern: 'fanChart', selectedAxis: 90 };
            expect(estimateCylinderRange(answer, DEFAULT_CYLINDER_RANGE)).toEqual([-2.00, 0.00]);
        });

        it('estimates cylinder range for JCC pattern (preference B)', () => {
            const answer: AstigmatismAnswer = { pattern: 'jcc', jccPreference: 'B', jccAxisB: 95 };
            expect(estimateCylinderRange(answer, [-2.00, 0.00])).toEqual([-2.00, -0.25]);
        });

        it('estimates cylinder range for JCC pattern (equal)', () => {
            const answer: AstigmatismAnswer = { pattern: 'jcc', jccPreference: 'equal' };
            expect(estimateCylinderRange(answer, [-4.00, 0.00])).toEqual([-4.00, -2.00]);
        });
    });

    describe('confidence and contradiction', () => {
        it('detects contradictory answers', () => {
            const answer: AstigmatismAnswer = { pattern: 'clockDial', selectedAxis: 10 };
            expect(isContradictoryAnswer(answer, [90, 100])).toBe(true);
        });

        it('detects non-contradictory answers', () => {
            const answer: AstigmatismAnswer = { pattern: 'clockDial', selectedAxis: 95 };
            expect(isContradictoryAnswer(answer, [90, 100])).toBe(false);
        });

        it('detects JCC contradictions', () => {
            const answer: AstigmatismAnswer = { pattern: 'jcc', jccPreference: 'A', jccAxisA: 10 };
            expect(isContradictoryAnswer(answer, [90, 100])).toBe(true);
        });

        it('calculates confidence for contradictory answer', () => {
            expect(calculateAstigmatismConfidence(1.0, true)).toBe(0.7);
            expect(calculateAstigmatismConfidence(0.2, true)).toBe(0.1); // enforced min 0.1
        });

        it('calculates confidence for consistent answer', () => {
            expect(calculateAstigmatismConfidence(0.8, false)).toBe(0.9);
            expect(calculateAstigmatismConfidence(1.0, false)).toBe(1.0); // enforced max 1.0
        });
    });

    describe('reliability warnings', () => {
        it('generates warning for low confidence', () => {
            const warnings = buildReliabilityWarnings(0.4, 3);
            expect(warnings).toContain('Low confidence due to contradictory answers.');
        });

        it('generates warning for insufficient data', () => {
            const warnings = buildReliabilityWarnings(1.0, 1);
            expect(warnings).toContain('Insufficient data for reliable estimation.');
        });

        it('generates no warnings for good state', () => {
            const warnings = buildReliabilityWarnings(0.9, 3);
            expect(warnings).toHaveLength(0);
        });
    });
});
