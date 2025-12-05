/**
 * Storage Utility
 * Wrapper around localStorage with type safety and error handling
 */

import { STORAGE_KEYS, type StorageKey } from '../config/constants';

class StorageService {
  /**
   * Get item from localStorage
   */
  get<T = string>(key: StorageKey): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      // Try to parse as JSON
      try {
        return JSON.parse(item) as T;
      } catch {
        // If parsing fails, return as string
        return item as T;
      }
    } catch (error) {
      console.error(`Error getting item ${key} from storage:`, error);
      return null;
    }
  }

  /**
   * Set item in localStorage
   */
  set<T>(key: StorageKey, value: T): void {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error setting item ${key} in storage:`, error);
    }
  }

  /**
   * Remove item from localStorage
   */
  remove(key: StorageKey): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from storage:`, error);
    }
  }

  /**
   * Clear all items from localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Check if key exists in localStorage
   */
  has(key: StorageKey): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Error checking if ${key} exists in storage:`, error);
      return false;
    }
  }

  /**
   * Get all keys from localStorage
   */
  keys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting storage keys:', error);
      return [];
    }
  }

  /**
   * Get storage size in bytes
   */
  size(): number {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return total;
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const storage = new StorageService();

// Re-export STORAGE_KEYS for convenience
export { STORAGE_KEYS };

/**
 * Get or create a consistent anonymous ID for non-logged-in users.
 * This ensures the same anonymous user gets the same "익명N" number across requests.
 */
export function getAnonymousId(): string {
  let anonymousId = storage.get<string>(STORAGE_KEYS.ANONYMOUS_ID);

  if (!anonymousId) {
    // Generate a new anonymous ID
    anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    storage.set(STORAGE_KEYS.ANONYMOUS_ID, anonymousId);
  }

  return anonymousId;
}
