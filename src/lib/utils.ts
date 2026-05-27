export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return amount < 0 ? `-${formatted}` : formatted;
}

export function formatCurrencyCompact(amount: number): string {
  const abs = Math.abs(amount);
  let formatted: string;
  if (abs >= 1_000_000) {
    formatted = `$${(abs / 1_000_000).toFixed(1)}M`;
  } else if (abs >= 1_000) {
    formatted = `$${(abs / 1_000).toFixed(1)}K`;
  } else {
    formatted = `$${abs.toFixed(0)}`;
  }
  return amount < 0 ? `-${formatted}` : formatted;
}

export function getQuarterLabel(date: Date = new Date()): string {
  const year = date.getFullYear();
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  return `${year}-Q${quarter}`;
}

export function parseQuarterLabel(label: string): { year: number; quarter: number } {
  const [year, q] = label.split('-Q');
  return { year: parseInt(year), quarter: parseInt(q) };
}

export function sortQuarterLabels(labels: string[]): string[] {
  return [...labels].sort((a, b) => {
    const pa = parseQuarterLabel(a);
    const pb = parseQuarterLabel(b);
    if (pa.year !== pb.year) return pa.year - pb.year;
    return pa.quarter - pb.quarter;
  });
}

export function getChangePercent(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}
