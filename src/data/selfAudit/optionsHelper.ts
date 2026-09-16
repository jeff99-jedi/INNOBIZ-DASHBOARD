import { SelfAuditOption } from '../../types';

export function createStandardOptions(
  points: number,
  texts: [string, string, string, string, string],
  defaultOptionNumber: number = 1
): SelfAuditOption[] {
  const rates = [100, 80, 60, 40, 20];
  const grades: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];
  const labels = ['①', '②', '③', '④', '⑤'];

  return texts.map((text, idx) => {
    const rate = rates[idx];
    const itemPoints = Math.round((points * rate) / 100 * 10) / 10;
    return {
      optionNumber: idx + 1,
      optionLabel: labels[idx],
      grade: grades[idx],
      text,
      points: itemPoints,
      scoreRate: rate,
      isRecommended: idx + 1 === defaultOptionNumber,
    };
  });
}
