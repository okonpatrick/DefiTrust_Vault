import { useState, useEffect } from 'react';

/**
 * @param query
 * @returns
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const documentChangeHandler = () => setMatches(mediaQueryList.matches);

    // Initial check
    documentChangeHandler();

    mediaQueryList.addEventListener('change', documentChangeHandler);
    return () => mediaQueryList.removeEventListener('change', documentChangeHandler);
  }, [query]);

  return matches;
}