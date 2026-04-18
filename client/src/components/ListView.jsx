import React from 'react';
import PropertyTable from './PropertyTable';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function ListView({ properties, total, page, limit, allSentinel, sortBy, sortDir, onEdit, onDelete, onPageChange, onSortChange, onLimitChange }) {
  const totalPages = Math.ceil(total / limit);
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd   = Math.min(page * limit, total);
  const isAll      = limit >= (allSentinel ?? 10000);

  return (
    <>
      <PropertyTable
        properties={properties}
        sortBy={sortBy}
        sortDir={sortDir}
        onEdit={onEdit}
        onDelete={onDelete}
        onSortChange={onSortChange}
      />
      <div className="flex items-center justify-between mt-4">
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-fg-muted)' }}>
          {total === 0 ? 'No results' : `${rangeStart}–${rangeEnd} of ${total}`}
        </span>
        <div className="flex items-center gap-4">
          <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-fg-muted)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            Per page
            <div className="gh-select" style={{ display: 'inline-flex' }}>
              <select
                value={isAll ? 'all' : limit}
                onChange={(e) => onLimitChange(e.target.value === 'all' ? (allSentinel ?? 10000) : Number(e.target.value))}
                aria-label="Page size"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
                <option value="all">All</option>
              </select>
            </div>
          </label>
          {totalPages > 1 && (
            <ul className="gh-pagination">
              <li>
                <button
                  className="gh-page-btn"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  aria-label="Previous page"
                >
                  ‹
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <li key={p}>
                  <button
                    className={`gh-page-btn${p === page ? ' active' : ''}`}
                    onClick={() => p !== page && onPageChange(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                </li>
              ))}
              <li>
                <button
                  className="gh-page-btn"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                  aria-label="Next page"
                >
                  ›
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

export default ListView;
