import React from 'react';
import PropertyTable from './PropertyTable';

function ListView({ properties, total, page, limit, onEdit, onDelete, onPageChange }) {
  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <PropertyTable
        properties={properties}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
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
        </div>
      )}
    </>
  );
}

export default ListView;
