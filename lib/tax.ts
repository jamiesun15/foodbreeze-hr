// 한국 4대보험 및 세금 계산 (2024년 기준)

export interface TaxResult {
  grossSalary: number;      // 총 지급액
  nationalPension: number;  // 국민연금
  healthInsurance: number;  // 건강보험
  longTermCare: number;     // 장기요양보험
  employmentInsurance: number; // 고용보험
  incomeTax: number;        // 소득세
  localIncomeTax: number;   // 지방소득세
  totalDeduction: number;   // 총 공제액
  netSalary: number;        // 실수령액
}

export function calculateTax(
  baseSalary: number,
  mealAllowance: number = 0,
  overtimePay: number = 0,
  otherAllowance: number = 0,
  dependents: number = 1
): TaxResult {
  // 총 지급액 (식대는 월 20만원까지 비과세)
  const taxFreeMeal = Math.min(mealAllowance, 200000);
  const grossSalary = baseSalary + mealAllowance + overtimePay + otherAllowance;

  // 과세 대상 금액 (비과세 제외)
  const taxableAmount = grossSalary - taxFreeMeal;

  // 국민연금: 4.5% (본인부담) - 상한액: 월 590만원
  const pensionBase = Math.min(baseSalary, 5900000);
  const nationalPension = Math.round(pensionBase * 0.045 / 10) * 10;

  // 건강보험: 3.545% (2024)
  const healthInsurance = Math.round(taxableAmount * 0.03545 / 10) * 10;

  // 장기요양보험: 건강보험료 × 12.95%
  const longTermCare = Math.round(healthInsurance * 0.1295 / 10) * 10;

  // 고용보험: 0.9%
  const employmentInsurance = Math.round(taxableAmount * 0.009 / 10) * 10;

  // 소득세 간이세액표 (근사치)
  const incomeTax = calculateIncomeTax(taxableAmount, dependents);

  // 지방소득세: 소득세의 10%
  const localIncomeTax = Math.round(incomeTax * 0.1 / 10) * 10;

  const totalDeduction = nationalPension + healthInsurance + longTermCare + employmentInsurance + incomeTax + localIncomeTax;
  const netSalary = grossSalary - totalDeduction;

  return {
    grossSalary,
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    incomeTax,
    localIncomeTax,
    totalDeduction,
    netSalary,
  };
}

// 간이세액표 (2024년 기준 근사값)
function calculateIncomeTax(monthlyTaxable: number, dependents: number): number {
  const annual = monthlyTaxable * 12;
  let tax = 0;

  if (annual <= 14000000) {
    tax = annual * 0.06;
  } else if (annual <= 50000000) {
    tax = 840000 + (annual - 14000000) * 0.15;
  } else if (annual <= 88000000) {
    tax = 6240000 + (annual - 50000000) * 0.24;
  } else if (annual <= 150000000) {
    tax = 15360000 + (annual - 88000000) * 0.35;
  } else {
    tax = 37060000 + (annual - 150000000) * 0.38;
  }

  // 부양가족 공제 (1인당 월 15만원 내외)
  const deduction = (dependents - 1) * 150000 * 12;
  tax = Math.max(0, tax - deduction);

  return Math.round((tax / 12) / 10) * 10;
}

// 숫자를 한국 금액 형식으로 변환
export function formatMoney(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

// 근무시간 계산
export function calculateWorkHours(checkIn: string, checkOut: string, lunchMinutes: number = 60): number {
  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);
  const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM) - lunchMinutes;
  return Math.max(0, Math.round(totalMinutes / 60 * 10) / 10);
}

// 초과근무 계산 (기본 6시간 초과분)
export function calculateOvertime(workHours: number, standardHours: number = 6): number {
  return Math.max(0, workHours - standardHours);
}
