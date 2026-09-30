import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { KitLocale } from '../contracts.js';
import type { DataColumn } from '../core/table.js';
import { queryRows, rowsToCsv } from '../core/table.js';
import { Button } from '../ui/primitives.js';

function SelectionCheckbox({ checked, mixed = false, label, onChange }: { checked: boolean; mixed?: boolean; label: string; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);
  return <input ref={ref} type="checkbox" aria-label={label} checked={checked} onChange={onChange}/>;
}
export function DataTable<Row>({ title, rows, columns, getRowId, pageSize = 5, locale = 'en', selectable = false, onSelectionChange }: {
  title: string;
  rows: readonly Row[];
  columns: readonly DataColumn<Row>[];
  getRowId: (row: Row) => string;
  pageSize?: number;
  locale?: KitLocale;
  selectable?: boolean;
  onSelectionChange?: (ids: readonly string[]) => void;
}) {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
    throw new RangeError('Page size must be 1–100.');
  const rowIds = rows.map(getRowId);
  if (new Set(rowIds).size !== rows.length)
    throw new Error('Row ids must be unique.');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ id: string; direction: 'asc' | 'desc' }>();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const filtered = useMemo(() => queryRows(rows, columns, query, sort), [rows, columns, query, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  useEffect(() => { setPage(0); }, [query, rows, pageSize]);
  useEffect(() => {
    const available = new Set(rowIds);
    setSelected(previous => {
      const next = new Set([...previous].filter(id => available.has(id)));
      if (next.size === previous.size && [...next].every(id => previous.has(id))) return previous;
      onSelectionChange?.([...next]);
      return next;
    });
  // Row identity is the selection boundary; stringify avoids requiring a memoized getRowId callback.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowIds.join('\u0000')]);
  const visible = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const ko = locale === 'ko';
  const selectedRows = rows.filter(row => selected.has(getRowId(row)));
  function download(mode: 'filtered' | 'selected') {
    const exportRows = mode === 'selected' ? selectedRows : filtered;
    const url = URL.createObjectURL(new Blob([rowsToCsv(exportRows, columns)], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = mode === 'selected' ? 'selected-data.csv' : 'filtered-data.csv';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function setSelection(next: Set<string>) {
    setSelected(next);
    onSelectionChange?.([...next]);
  }
  function toggleRow(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelection(next);
  }
  function toggleVisible() {
    const ids = visible.map(getRowId);
    const everySelected = ids.length > 0 && ids.every(id => selected.has(id));
    const next = new Set(selected);
    ids.forEach(id => everySelected ? next.delete(id) : next.add(id));
    setSelection(next);
  }
  const allVisibleSelected = visible.length > 0 && visible.every(row => selected.has(getRowId(row)));
  const someVisibleSelected = visible.some(row => selected.has(getRowId(row)));
  return <section className="kk-table-section">
    <div className="kk-table-toolbar">
      <h3>{title}</h3>
      <div>
        <label className="kk-field-inline"><span>{ko ? '검색' : 'Search'}</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={ko ? '모든 열 검색' : 'Search all columns'} /></label>
        {selectable && selectedRows.length > 0 && <Button onClick={() => download('selected')}>{ko ? `선택 ${selectedRows.length}행 CSV` : `Export ${selectedRows.length} selected ${selectedRows.length === 1 ? 'row' : 'rows'}`}</Button>}
        <Button onClick={() => download('filtered')}>{ko ? `필터 결과 ${filtered.length}행 CSV` : `Export ${filtered.length} filtered ${filtered.length === 1 ? 'row' : 'rows'}`}</Button>
      </div>
    </div>
    <div className="kk-table-scroll" tabIndex={0} aria-label={title}>
      <table className="kk-table">
        <caption className="kk-sr-only">{title}</caption>
        <thead><tr>
          {selectable && <th scope="col" className="kk-table-select"><SelectionCheckbox label={ko ? '현재 페이지 행 선택' : 'Select rows on this page'} checked={allVisibleSelected} mixed={someVisibleSelected && !allVisibleSelected} onChange={toggleVisible}/></th>}
          {columns.map(col => <th key={col.id} scope="col" aria-sort={sort?.id === col.id ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><Button variant="quiet" onClick={() => { setSort({ id: col.id, direction: sort?.id === col.id && sort.direction === 'asc' ? 'desc' : 'asc' }); setPage(0); }}>{col.label}{sort?.id === col.id ? sort.direction === 'asc' ? ' ↑' : ' ↓' : ''}</Button></th>)}
        </tr></thead>
        <tbody>
          {visible.map(row => { const id = getRowId(row); return <tr key={id} data-selected={selectable && selected.has(id) ? 'true' : undefined}>
            {selectable && <td className="kk-table-select"><SelectionCheckbox label={`${ko ? '행 선택' : 'Select row'} ${id}`} checked={selected.has(id)} onChange={() => toggleRow(id)}/></td>}
            {columns.map(col => <td key={col.id} style={{ textAlign: col.align }}>{String(col.value(row) ?? '—')}</td>)}
          </tr>; })}
          {visible.length === 0 && <tr><td colSpan={columns.length + (selectable ? 1 : 0)}>{ko ? '조건에 맞는 행이 없습니다.' : 'No rows match this search.'}</td></tr>}
        </tbody>
      </table>
    </div>
    <div className="kk-table-footer">
      <span role="status">{ko ? `${filtered.length}행 · ${currentPage + 1}/${pages} 페이지${selectable ? ` · ${selected.size}행 선택` : ''}` : `${filtered.length} rows · Page ${currentPage + 1} of ${pages}${selectable ? ` · ${selected.size} selected` : ''}`}</span>
      <div><Button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>{ko ? '이전' : 'Previous'}</Button><Button disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>{ko ? '다음' : 'Next'}</Button></div>
    </div>
  </section>;
}
