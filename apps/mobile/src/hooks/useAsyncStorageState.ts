import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Custom hook for persistent state using AsyncStorage.
 * Similar to useState but persists value to AsyncStorage.
 */
export function useAsyncStorageState<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void, boolean] {
  const [state, setState] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial value from AsyncStorage
  useEffect(() => {
    const loadValue = async () => {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored !== null) {
          setState(JSON.parse(stored) as T);
        }
      } catch (error) {
        console.error(`Error loading AsyncStorage key "${key}":`, error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadValue();
  }, [key]);

  // Update value and persist to AsyncStorage
  const setValue = useCallback(
    (value: T) => {
      setState(value);
      AsyncStorage.setItem(key, JSON.stringify(value)).catch((error) => {
        console.error(`Error saving AsyncStorage key "${key}":`, error);
      });
    },
    [key],
  );

  return [state, setValue, isLoading];
}
