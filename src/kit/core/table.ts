export type CellValue = string | number | boolean | null;
export interface DataColumn<Row> {
  id: string;
  label: string;
  value: (row: Row) => CellValue;
  align?: 'start' | 'end';
}
export function queryRows<Row>(rows: readonly Row[], columns: readonly DataColumn<Row>[], query = '', sort?: {
  id: string;
  direction: 'asc' | 'desc';
}) {
  if (new Set(columns.map(c => c.id)).size !== columns.length)
    throw new Error('Column ids must be unique.');
  const normalized = query.trim().toLowerCase();
  const filtered = rows.filter(row => !normalized || columns.some(c => String(c.value(row) ?? '').toLowerCase().includes(normalized)));
  if (!sort)
    return filtered;
  const col = columns.find(c => c.id === sort.id);
  if (!col)
    throw new Error('Unknown sort column.');
  return filtered.map((row, i) => ({ row, i })).sort((a, b) => {
    const x = col.value(a.row), y = col.value(b.row);
    if (x === null)
      return y === null ? a.i - b.i : 1;
    if (y === null)
      return -1;
    const comparison = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'en', { numeric: true });
    return (sort.direction === 'asc' ? comparison : -comparison) || a.i - b.i;
  }).map(item => item.row);
}
function csvCell(value: CellValue): string {
  let text = value === null ? '' : String(value);
  // Neutralize formulas in text; legitimate negative numeric values stay numeric.
  if (typeof value === 'string' && /^[\s\uFEFF]*[=+@-]/.test(text))
    text = `'${text}`;
  if (typeof value === 'number' && !Number.isFinite(value))
    throw new RangeError('Non-finite CSV number.');
  return `"${text.replaceAll('"', '""')}"`;
}
export function rowsToCsv<Row>(rows: readonly Row[], columns: readonly DataColumn<Row>[]): string {
  return '\uFEFF' + [columns.map(c => csvCell(c.label)).join(','), ...rows.map(row => columns.map(c => csvCell(c.value(row))).join(','))].join('\r\n') + '\r\n';
}
