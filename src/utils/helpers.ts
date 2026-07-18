import type { Fund } from '../types';

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatCurrency(amount: number, currency = '₹'): string {
  const rounded = round2(amount);
  const isWhole = rounded === Math.floor(rounded);
  return `${currency}${rounded.toLocaleString('en-IN', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export function getROI(invested: number, current: number): number {
  if (invested === 0) return 0;
  return ((current - invested) / invested) * 100;
}

export function getMonthsRemaining(deadline: string): number {
  const now = new Date();
  const end = new Date(deadline);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (30 * 24 * 60 * 60 * 1000)));
}

export function calculateMonthlyRequired(goal: number, current: number, deadline: string): number {
  const months = getMonthsRemaining(deadline);
  if (months <= 0) return 0;
  const remaining = goal - current;
  if (remaining <= 0) return 0;
  return round2(remaining / months);
}

export function getFundColor(funds: Fund[], fundId: number): string {
  return funds.find((f) => f.id === fundId)?.color || '#71717a';
}

export function getFundName(funds: Fund[], fundId: number): string {
  return funds.find((f) => f.id === fundId)?.name || 'unknown';
}

export const assetTypeLabels: Record<string, string> = {
  stock: 'Stock',
  mutual_fund: 'Mutual Fund',
  fd: 'Fixed Deposit',
  ppf: 'PPF',
  crypto: 'Crypto',
  other: 'Other',
};

export const priorityLabels: Record<number, string> = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
};

export const priorityColors: Record<number, string> = {
  0: 'bg-white/10 text-txt-secondary',
  1: 'bg-amber-500/15 text-amber-400',
  2: 'bg-red-500/15 text-red-400',
};
