'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SearchSuggestions } from 'brainerce';
import { getClient } from '@/lib/brainerce';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const SUGGESTION_LIMIT = 5;

interface UseSearchResult {
  suggestions: SearchSuggestions | null;
  loading: boolean;
}

export function useSearch(query: string): UseSearchResult {
  const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      setLoading(true);
      const client = getClient();
      const result = await client.getSearchSuggestions(searchQuery, SUGGESTION_LIMIT);
      setSuggestions(result);
    } catch {
      // Silently ignore errors (likely aborted or network issue)
      setSuggestions(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // Clear suggestions if query is too short
    if (!query || query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions(null);
      setLoading(false);
      return;
    }

    // Debounce the search
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query.trim());
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return { suggestions, loading };
}
