import { useMemo, useCallback, useState } from 'react';

export interface UsePaginationReturn {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  goToFirstPage: () => void;
  goToLastPage: (totalPages: number) => void;
  goToPreviousPage: () => void;
  goToNextPage: (totalPages: number) => void;
  goToPage: (page: number) => void;
  hasPreviousPage: boolean;
  hasNextPage: (totalPages: number) => boolean;
}

export const usePagination = (
  initialItemsPerPage: number = 10,
  initialCurrentPage: number = 1
): UsePaginationReturn => {
  const [currentPage, setCurrentPageInternal] = useState(initialCurrentPage);
  const [itemsPerPage, setItemsPerPageInternal] = useState(initialItemsPerPage);

  const setCurrentPage = useCallback((page: number) => {
    setCurrentPageInternal(Math.max(1, page));
  }, []);

  const setItemsPerPage = useCallback(
    (items: number) => {
      setItemsPerPageInternal(items);
      setCurrentPage(1); // Reset to first page when changing items per page
    },
    [setCurrentPage]
  );

  const goToFirstPage = useCallback(() => setCurrentPage(1), [setCurrentPage]);
  const goToLastPage = useCallback(
    (totalPages: number) => setCurrentPage(totalPages),
    [setCurrentPage]
  );
  const goToPreviousPage = useCallback(
    () => setCurrentPage(currentPage - 1),
    [currentPage, setCurrentPage]
  );
  const goToNextPage = useCallback(
    () => setCurrentPage(currentPage + 1),
    [currentPage, setCurrentPage]
  );
  const goToPage = useCallback(
    (page: number) => setCurrentPage(page),
    [setCurrentPage]
  );

  const hasPreviousPage = useMemo(() => currentPage > 1, [currentPage]);
  const hasNextPage = useCallback(
    (totalPages: number) => currentPage < totalPages,
    [currentPage]
  );

  // Note: totalItems and totalPages are not computed here; they depend on external data.
  // This hook provides the controls; consumers pass totalItems to compute totalPages externally.

  return useMemo(
    () => ({
      currentPage,
      itemsPerPage,
      totalPages: 0, // Placeholder; compute externally
      totalItems: 0, // Placeholder
      startIndex: (currentPage - 1) * itemsPerPage,
      endIndex: currentPage * itemsPerPage,
      setCurrentPage,
      setItemsPerPage,
      goToFirstPage,
      goToLastPage,
      goToPreviousPage,
      goToNextPage,
      goToPage,
      hasPreviousPage,
      hasNextPage,
    }),
    [
      currentPage,
      itemsPerPage,
      setCurrentPage,
      setItemsPerPage,
      goToFirstPage,
      goToLastPage,
      goToPreviousPage,
      goToNextPage,
      goToPage,
      hasPreviousPage,
      hasNextPage,
    ]
  );
};
