type PgkQuestion = {
  jawabanBenar?: unknown;
  opsi?: unknown;
};

type MatchingQuestion = {
  pasangan?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const getMatchingScoreRatio = (
  question: MatchingQuestion,
  answer: unknown
): number => {
  if (!Array.isArray(question.pasangan) || !isRecord(answer)) return 0;
  if (question.pasangan.length === 0) return 0;

  const correctCount = question.pasangan.reduce((count, pair, index) => {
    if (!isRecord(pair) || typeof pair.right !== "string") return count;
    return count + (answer[String(index)] === pair.right ? 1 : 0);
  }, 0);
  return correctCount / question.pasangan.length;
};

export const getPgkScoreRatio = (
  question: PgkQuestion,
  answer: unknown
): number => {
  const correctLabels = new Set(
    (Array.isArray(question.jawabanBenar)
      ? question.jawabanBenar
      : typeof question.jawabanBenar === "string"
        ? [question.jawabanBenar]
        : []
    ).filter((label): label is string => typeof label === "string")
  );
  if (correctLabels.size === 0) return 0;

  if (Array.isArray(answer)) {
    const selectedCorrectLabels = new Set(
      answer.filter(
        (label): label is string =>
          typeof label === "string" && correctLabels.has(label)
      )
    );
    return Math.min(1, selectedCorrectLabels.size / correctLabels.size);
  }

  if (!isRecord(answer)) return 0;
  const options = Array.isArray(question.opsi) ? question.opsi : [];
  if (options.length === 0) return 0;

  const correctClassifications = options.filter((_, index) => {
    const expected = correctLabels.has(String.fromCharCode(65 + index))
      ? "Benar"
      : "Salah";
    return answer[String(index)] === expected;
  }).length;
  return correctClassifications / options.length;
};
