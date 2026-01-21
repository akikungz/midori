"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "./useCommon";
import { fetchClient } from "@midori/lib/api";

type AutocompleteEndpoint =
  | "/api/autocomplete/courses"
  | "/api/autocomplete/semesters"
  | "/api/autocomplete/instructors"
  | "/api/autocomplete/templates"
  | "/api/autocomplete/course-offerings";

interface AutocompleteOption {
  id: number;
  label: string;
}

interface UseAutocompleteOptions {
  /** The autocomplete API endpoint to use */
  endpoint: AutocompleteEndpoint;
  /** Maximum number of results to return */
  limit?: number;
  /** Debounce delay in ms for search input */
  debounceMs?: number;
  /** Whether to enable the query */
  enabled?: boolean;
}

interface UseAutocompleteReturn {
  /** Current search query */
  search: string;
  /** Set the search query */
  setSearch: (value: string) => void;
  /** Autocomplete options from the API */
  options: AutocompleteOption[];
  /** Whether the query is loading */
  isLoading: boolean;
  /** Whether the query is fetching (including background refetch) */
  isFetching: boolean;
  /** Any error from the query */
  error: Error | null;
  /** Reset the search query */
  reset: () => void;
}

/**
 * Hook for fetching autocomplete suggestions from the API
 *
 * @example
 * ```tsx
 * const { search, setSearch, options, isLoading } = useAutocomplete({
 *   endpoint: "/api/autocomplete/courses",
 *   limit: 10,
 * });
 * ```
 */
export function useAutocomplete({
  endpoint,
  limit = 10,
  debounceMs = 300,
  enabled = true,
}: UseAutocompleteOptions): UseAutocompleteReturn {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, debounceMs);

  const queryKey = useMemo(
    () => ["autocomplete", endpoint, debouncedSearch, limit],
    [endpoint, debouncedSearch, limit],
  );

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await fetchClient.GET(endpoint, {
        params: {
          query: {
            search: debouncedSearch || undefined,
            limit,
          },
        },
      });

      if (error) {
        throw new Error("Failed to fetch autocomplete options");
      }

      return data as AutocompleteOption[];
    },
    enabled: enabled,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const reset = useCallback(() => {
    setSearch("");
  }, []);

  return {
    search,
    setSearch,
    options: data || [],
    isLoading,
    isFetching,
    error: error as Error | null,
    reset,
  };
}

/**
 * Hook for multi-select with autocomplete
 * Combines useAutocomplete with selection state management
 */
interface UseMultiSelectAutocompleteOptions extends UseAutocompleteOptions {
  /** Initially selected option IDs */
  initialSelected?: number[];
}

interface UseMultiSelectAutocompleteReturn extends UseAutocompleteReturn {
  /** Currently selected option IDs */
  selected: number[];
  /** Toggle selection of an option */
  toggle: (id: number) => void;
  /** Select all provided IDs */
  selectAll: (ids: number[]) => void;
  /** Clear all selections */
  clearSelected: () => void;
  /** Check if an option is selected */
  isSelected: (id: number) => boolean;
}

export function useMultiSelectAutocomplete({
  initialSelected = [],
  ...autocompleteOptions
}: UseMultiSelectAutocompleteOptions): UseMultiSelectAutocompleteReturn {
  const autocomplete = useAutocomplete(autocompleteOptions);
  const [selected, setSelected] = useState<number[]>(initialSelected);

  const toggle = useCallback((id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const selectAll = useCallback((ids: number[]) => {
    setSelected(ids);
  }, []);

  const clearSelected = useCallback(() => {
    setSelected([]);
  }, []);

  const isSelected = useCallback(
    (id: number) => selected.includes(id),
    [selected],
  );

  return {
    ...autocomplete,
    selected,
    toggle,
    selectAll,
    clearSelected,
    isSelected,
  };
}

export type { AutocompleteOption, AutocompleteEndpoint };
