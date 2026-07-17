export function formatCurrency(amount: number, currency = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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

export const fundColors: Record<string, string> = {
  needs: '#FF2A2A',
  wants: '#A78BFA',
  savings: '#4ADE80',
};

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
