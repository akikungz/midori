import { useState, useCallback, useEffect, useMemo } from "react";

/**
 * Hook for debouncing a value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for managing pagination state
 */
export function usePagination(initialPage = 1, initialPageSize = 10) {
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const nextPage = useCallback((totalPages: number) => {
    setPage((p) => Math.min(totalPages, p + 1));
  }, []);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    pageSize,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    setPage,
  };
}

/**
 * Hook for managing dialog state with a selected item
 */
export function useDialogState<T = unknown>() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const open = useCallback((item?: T) => {
    if (item !== undefined) {
      setSelectedItem(item);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedItem(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    selectedItem,
    open,
    close,
    toggle,
    setIsOpen,
    setSelectedItem,
  };
}

/**
 * Hook for managing form submission state
 */
export function useSubmitState() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const startSubmit = useCallback(() => setIsSubmitting(true), []);
  const endSubmit = useCallback(() => setIsSubmitting(false), []);
  const startLoading = useCallback(() => setIsLoading(true), []);
  const endLoading = useCallback(() => setIsLoading(false), []);

  const withSubmit = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      setIsSubmitting(true);
      try {
        return await fn();
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return {
    isSubmitting,
    isLoading,
    startSubmit,
    endSubmit,
    startLoading,
    endLoading,
    withSubmit,
  };
}

/**
 * Hook for managing search state with debounce-like behavior
 */
export function useSearch(onReset?: () => void) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setIsSearching(false);
    onReset?.();
  }, [onReset]);

  return {
    searchQuery,
    isSearching,
    handleSearch,
    clearSearch,
    setSearchQuery,
  };
}

/**
 * Hook for managing selection state (single or multiple items)
 */
export function useSelection<T extends number | string>(
  initialSelected: T[] = [],
) {
  const [selected, setSelected] = useState<T[]>(initialSelected);

  const toggle = useCallback((id: T) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const select = useCallback((id: T) => {
    setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const deselect = useCallback((id: T) => {
    setSelected((prev) => prev.filter((item) => item !== id));
  }, []);

  const clear = useCallback(() => {
    setSelected([]);
  }, []);

  const selectAll = useCallback((ids: T[]) => {
    setSelected(ids);
  }, []);

  const isSelected = useCallback((id: T) => selected.includes(id), [selected]);

  return useMemo(
    () => ({
      selected,
      toggle,
      select,
      deselect,
      clear,
      selectAll,
      isSelected,
      setSelected,
    }),
    [selected, toggle, select, deselect, clear, selectAll, isSelected],
  );
}
