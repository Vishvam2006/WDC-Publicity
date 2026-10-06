import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'wdc_publicity_visited_classes';

interface StoredData {
  weekAnchor: number;
  visited: string[];
}

function getMostRecentSunday(): number {
  const d = new Date();
  // Reset time to start of the day
  d.setHours(0, 0, 0, 0);
  // Subtract the current day of the week to get back to Sunday
  // If today is Sunday (0), it stays on today
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

export function usePublicityTracker() {
  const [visitedClasses, setVisitedClasses] = useState<Set<string>>(new Set());

  // Initialize from local storage on mount
  useEffect(() => {
    const rawData = localStorage.getItem(STORAGE_KEY);
    const currentSunday = getMostRecentSunday();

    if (rawData) {
      try {
        const data: StoredData = JSON.parse(rawData);
        // If the stored data belongs to the current week, restore it
        if (data.weekAnchor === currentSunday) {
          setVisitedClasses(new Set(data.visited));
          return;
        }
      } catch (e) {
        console.error('Failed to parse publicity tracker data from local storage', e);
      }
    }
    
    // If we're here, it's either empty, invalid, or an old week (needs a reset).
    setVisitedClasses(new Set());
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      weekAnchor: currentSunday,
      visited: []
    }));
  }, []);

  const toggleVisited = useCallback((classId: string) => {
    setVisitedClasses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      
      // Save to local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        weekAnchor: getMostRecentSunday(),
        visited: Array.from(newSet)
      }));
      
      return newSet;
    });
  }, []);

  const isVisited = useCallback((classId: string) => {
    return visitedClasses.has(classId);
  }, [visitedClasses]);

  const resetVisited = useCallback(() => {
    setVisitedClasses(new Set());
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      weekAnchor: getMostRecentSunday(),
      visited: []
    }));
  }, []);

  return { visitedClasses, toggleVisited, isVisited, resetVisited };
}
