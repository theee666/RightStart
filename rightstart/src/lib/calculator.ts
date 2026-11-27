export type Contribution = { name: string; base: number; personal: number; employer: number };
export function calculateContributions(rows: Contribution[]) {
  if (
    rows.some(
      (r) =>
        !Number.isFinite(r.base) ||
        r.base < 0 ||
        !Number.isFinite(r.personal) ||
        !Number.isFinite(r.employer) ||
        r.personal < 0 ||
        r.employer < 0 ||
        r.personal > 100 ||
        r.employer > 100,
    )
  )
    throw new Error('请填写非负基数及 0–100% 的比例。');
  const cents = (base: number, rate: number) => Math.round(base * rate) / 100;
  const details = rows.map((r) => ({
    ...r,
    personalAmount: cents(r.base, r.personal),
    employerAmount: cents(r.base, r.employer),
  }));
  const personal = Math.round(details.reduce((sum, r) => sum + r.personalAmount, 0) * 100) / 100;
  const employer = Math.round(details.reduce((sum, r) => sum + r.employerAmount, 0) * 100) / 100;
  return { details, personal, employer, total: Math.round((personal + employer) * 100) / 100 };
}
