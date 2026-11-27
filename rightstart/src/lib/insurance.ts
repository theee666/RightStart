import { calculateContributions } from './calculator';
export type InsuranceInput = {
  salary: number;
  socialBase: number;
  fundBase: number;
  rates: { name: string; personal: number; employer: number }[];
  fundPersonal: number;
  fundEmployer: number;
};
export function calculateInsurance(input: InsuranceInput) {
  if (
    ![input.salary, input.socialBase, input.fundBase].every(
      (n) => Number.isFinite(n) && n >= 0 && n <= 10000000,
    )
  )
    throw new Error('请填写 0–10000000 元范围内的工资与基数。');
  const result = calculateContributions([
    ...input.rates.map((r) => ({ ...r, base: input.socialBase })),
    {
      name: '住房公积金',
      base: input.fundBase,
      personal: input.fundPersonal,
      employer: input.fundEmployer,
    },
  ]);
  const fund = result.details.at(-1)!;
  return {
    ...result,
    fundTotal: Math.round((fund.personalAmount + fund.employerAmount) * 100) / 100,
    beforeTax: Math.round((input.salary - result.personal) * 100) / 100,
  };
}
