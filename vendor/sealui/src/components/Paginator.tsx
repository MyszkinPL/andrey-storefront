import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export type PaginatorProps = {
  /** Общее число записей; число страниц = ceil(totalCount / pageSize). */
  totalCount: number;
  /** Записей на странице. */
  pageSize: number;
  /** Активная страница, начиная с 1; управляемая — состояние у вызывающего. */
  currentPage: number;
  /** Число соседних страниц вокруг текущей, как у Polar (по умолчанию 1). */
  siblingCount?: number;
  onPageChange: (page: number) => void;
};

type PageItem = number | typeof DOTS;

const DOTS = Symbol('DOTS');

// Алгоритм перенесён из Polar atoms/Paginator (usePagination) 1:1.
function usePagination({
  totalCount,
  pageSize,
  siblingCount = 1,
  currentPage,
}: {
  totalCount: number;
  pageSize: number;
  siblingCount?: number;
  currentPage: number;
}): PageItem[] {
  const totalPageCount = Math.ceil(totalCount / pageSize);

  // Pages count is determined as siblingCount + firstPage + lastPage + currentPage + 2*DOTS
  const totalPageNumbers = siblingCount + 5;

  // Case 1: диапазон целиком, если страниц меньше, чем слотов
  if (totalPageNumbers >= totalPageCount) {
    return range(1, totalPageCount);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPageCount);

  // DOTS не показываем, когда между соседями и краем всего один номер
  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2;

  const firstPageIndex = 1;
  const lastPageIndex = totalPageCount;

  // Case 2: точки только справа
  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    return [...range(1, leftItemCount), DOTS, lastPageIndex];
  }

  // Case 3: точки только слева
  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    return [firstPageIndex, DOTS, ...range(totalPageCount - rightItemCount + 1, totalPageCount)];
  }

  // Case 4: точки с обеих сторон
  return [firstPageIndex, DOTS, ...range(leftSiblingIndex, rightSiblingIndex), DOTS, lastPageIndex];
}

function range(start: number, end: number): number[] {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
}

/**
 * Polar Paginator: ряд по центру с шагом 8 — стрелка, кнопки страниц sm
 * (активная primary, остальные secondary), многоточия между диапазонами.
 * Рендерится только когда страниц больше одной.
 */
export function Paginator({
  totalCount,
  pageSize,
  currentPage,
  siblingCount = 1,
  onPageChange,
}: PaginatorProps) {
  const paginationRange = usePagination({ totalCount, pageSize, siblingCount, currentPage });

  // Как в Polar: нулевая страница или меньше двух элементов диапазона — не рендерим
  if (currentPage < 1 || paginationRange.length < 2) {
    return null;
  }

  const maybeLastPage = paginationRange[paginationRange.length - 1];
  const lastPage = typeof maybeLastPage === 'number' ? maybeLastPage : 1;

  return (
    <nav className="seal-paginator" aria-label="Pagination">
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} aria-hidden />
      </Button>
      {paginationRange.map((item, idx) => {
        if (typeof item !== 'number') {
          return (
            <span className="seal-paginator-dots" key={`dots-${idx}`} aria-hidden>
              &#8230;
            </span>
          );
        }
        return (
          <Button
            key={item}
            size="sm"
            variant={item === currentPage ? 'primary' : 'secondary'}
            onClick={() => item !== currentPage && onPageChange(item)}
            aria-label={`Page ${item}`}
            aria-current={item === currentPage ? 'page' : undefined}
          >
            {item}
          </Button>
        );
      })}
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage >= lastPage}
        onClick={() => currentPage < lastPage && onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        <ChevronRight size={16} aria-hidden />
      </Button>
    </nav>
  );
}
