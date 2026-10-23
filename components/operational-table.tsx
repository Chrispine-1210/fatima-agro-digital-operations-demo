"use client";

import { useId, useMemo, useState } from "react";

export type OperationalColumn = { key: string; label: string; money?: boolean; date?: boolean };
type Row = Record<string, unknown>;
const collator = new Intl.Collator("en-GB", { numeric: true, sensitivity: "base" });

function valueText(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.map(String).join(", ") || "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function displayValue(value: unknown, column: OperationalColumn): string {
  if (column.money) return `MWK ${Number(value ?? 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
  if (column.date && value) {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) return date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Blantyre" });
  }
  return valueText(value);
}

/** CSV cells are always quoted. Untrusted spreadsheet formula prefixes, including
 * prefixes after whitespace/control characters, are escaped as literal text. */
function csvCell(value: string): string {
  const safe = /^[\u0000-\u0020]*[=+\-@]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

function statusTone(value: unknown): string {
  if (typeof value === "boolean") return value ? "success" : "neutral";
  const status = String(value ?? "").toLowerCase();
  if (/^(paid|matched|approved|active|completed|received|answered|responded|published|present|applied|captured)$/.test(status)) return "success";
  if (/declined|cancelled|absent|blocked|failed|out of stock/.test(status)) return "danger";
  if (/pending|unpaid|part |unmatched|awaiting|open|onboarding|setup|scheduled|draft/.test(status)) return "attention";
  return "neutral";
}

export function OperationalTable({ rows = [], columns, empty = "No records yet.", caption }: { rows?: object[]; columns: OperationalColumn[]; empty?: string; caption: string }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [exportNotice, setExportNotice] = useState("");
  const records = rows as Row[];
  const statusColumn = columns.find(column => column.key === "status" || column.key === "outcome" || column.key === "reconciled");
  const statuses = statusColumn ? [...new Set(records.map(row => valueText(row[statusColumn.key])))].sort(collator.compare) : [];
  const needle = query.trim().toLocaleLowerCase("en-GB");
  const filtered = useMemo(() => {
    const matched = records.filter(row => (!status || !statusColumn || valueText(row[statusColumn.key]) === status) && (!needle || columns.some(column => `${valueText(row[column.key])} ${displayValue(row[column.key], column)}`.toLocaleLowerCase("en-GB").includes(needle))));
    if (!sort) return matched;
    const column = columns.find(item => item.key === sort.key);
    return matched.map((row, index) => ({ row, index })).sort((a, b) => {
      const left = a.row[sort.key], right = b.row[sort.key];
      let order: number;
      if (left == null || left === "") order = right == null || right === "" ? 0 : 1;
      else if (right == null || right === "") order = -1;
      else if (typeof left === "number" && typeof right === "number") order = left - right;
      else if (column?.date && Number.isFinite(Date.parse(String(left))) && Number.isFinite(Date.parse(String(right)))) order = Date.parse(String(left)) - Date.parse(String(right));
      else order = collator.compare(valueText(left), valueText(right));
      return (sort.direction === "asc" ? order : -order) || a.index - b.index;
    }).map(item => item.row);
  }, [records, columns, status, statusColumn, needle, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const start = filtered.length ? currentPage * pageSize + 1 : 0;
  const end = Math.min((currentPage + 1) * pageSize, filtered.length);
  const hasFilters = !!query || !!status;

  function clearFilters() { setQuery(""); setStatus(""); setPage(0); setExportNotice(""); }
  function exportCsv() {
    // Only the rows already delivered to this role and the displayed columns are
    // exported. No other endpoint, hidden row fields or other unit data is read.
    const lines = [columns.map(column => csvCell(column.label)).join(","), ...filtered.map(row => columns.map(column => csvCell(displayValue(row[column.key], column))).join(","))];
    const url = URL.createObjectURL(new Blob(["\ufeff", lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `fatima-${caption.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportNotice(`Exported ${filtered.length} matching ${filtered.length === 1 ? "record" : "records"}. Keep this file within your authorised team.`);
  }

  return <div className="op-register" role="region" aria-label={caption}>
    <div className="op-register-heading"><div><h3>{caption}</h3><p>{records.length.toLocaleString("en-GB")} authorised {records.length === 1 ? "record" : "records"}</p></div><button type="button" className="op-export" onClick={exportCsv} disabled={!filtered.length} aria-label={`Export ${caption} as CSV`}><span aria-hidden="true">↓</span> Export CSV</button></div>
    {!!records.length && <div className="op-table-tools"><label className="op-search" htmlFor={`${id}-search`}><span className="ip-sr-only">Search {caption}</span><span aria-hidden="true">⌕</span><input id={`${id}-search`} type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(0); setExportNotice(""); }} placeholder="Search this register…" maxLength={200} /></label>{statusColumn && statuses.length > 1 && <label className="op-status-filter"><span className="ip-sr-only">Filter {caption} by {statusColumn.label.toLowerCase()}</span><select aria-label={`Filter ${caption} by ${statusColumn.label.toLowerCase()}`} value={status} onChange={event => { setStatus(event.target.value); setPage(0); setExportNotice(""); }}><option value="">All {statusColumn.label.toLowerCase()}</option>{statuses.map(value => <option key={value} value={value}>{value}</option>)}</select></label>}{hasFilters && <button className="op-clear" type="button" onClick={clearFilters}>Clear filters</button>}</div>}
    {!records.length ? <div className="op-empty"><span aria-hidden="true">≡</span><div><strong>This register is ready for your first record</strong><p>{empty}</p></div></div> : !filtered.length ? <div className="op-empty" role="status"><span aria-hidden="true">⌕</span><div><strong>No matching records</strong><p>Try another reference, name or status.</p><button type="button" className="op-clear" onClick={clearFilters}>Clear filters</button></div></div> : <div className="ip-table-wrap" tabIndex={0} aria-label={`${caption}, scroll to see all columns`}><table className="ip-table"><caption>{caption}</caption><thead><tr>{columns.map(column => <th key={column.key} scope="col" aria-sort={sort?.key === column.key ? sort.direction === "asc" ? "ascending" : "descending" : "none"}><button type="button" className="op-sort" onClick={() => { setSort({ key: column.key, direction: sort?.key === column.key && sort.direction === "asc" ? "desc" : "asc" }); setPage(0); }} aria-label={`Sort ${caption} by ${column.label.toLowerCase()}`}><span>{column.label}</span><span className={sort?.key === column.key ? "is-sorted" : ""} aria-hidden="true">{sort?.key === column.key ? sort.direction === "asc" ? "↑" : "↓" : "↕"}</span></button></th>)}</tr></thead><tbody>{visible.map((row, index) => <tr key={`${String(row.id ?? "row")}-${index}`}>{columns.map(column => <td key={column.key} className={column.money || typeof row[column.key] === "number" ? "op-number" : undefined}>{column.key === "status" || column.key === "outcome" || typeof row[column.key] === "boolean" ? <span className={`op-status op-status-${statusTone(row[column.key])}`}>{displayValue(row[column.key], column)}</span> : displayValue(row[column.key], column)}</td>)}</tr>)}</tbody></table></div>}
    {!!records.length && <div className="op-pagination"><p role="status" aria-live="polite">{start}–{end} of {filtered.length.toLocaleString("en-GB")}{filtered.length !== records.length ? ` matching · ${records.length} total` : " records"}</p><label>Rows <select aria-label={`Rows per page for ${caption}`} value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(0); }}>{[10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}</select></label><div className="op-page-buttons"><button type="button" onClick={() => setPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} aria-label={`Previous page of ${caption}`}>← <span>Previous</span></button><span>{currentPage + 1} / {pageCount}</span><button type="button" onClick={() => setPage(Math.min(pageCount - 1, currentPage + 1))} disabled={currentPage >= pageCount - 1} aria-label={`Next page of ${caption}`}><span>Next</span> →</button></div></div>}
    {exportNotice && <p className="op-export-notice" role="status">{exportNotice}</p>}
  </div>;
}
