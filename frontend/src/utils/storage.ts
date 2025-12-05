export type StorageKey =
  | 'careguide_token'
  | 'careguide_user'
  | 'careguide_session_id'
  | 'careguide_chat_messages'
  | 'careguide_quiz_prompt_shown'
  | 'careguide_user_message_count';

const REGISTERED_KEYS: StorageKey[] = [
  'careguide_token',
  'careguide_user',
  'careguide_session_id',
  'careguide_chat_messages',
  'careguide_quiz_prompt_shown',
  'careguide_user_message_count',
];

class StorageService {
  private get storage(): Storage | null {
    if (typeof window === 'undefined') {
      console.warn('Storage is unavailable in this environment.');
      return null;
    }

    try {
      return window.localStorage;
    } catch (error) {
      console.warn('Failed to access localStorage:', error);
      return null;
    }
  }

  get<T>(key: StorageKey): T | null {
    const storage = this.storage;
    if (!storage) return null;

    try {
      const raw = storage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`Failed to parse ${key} from storage:`, error);
      storage.removeItem(key);
      return null;
    }
  }

  set<T>(key: StorageKey, value: T): void {
    const storage = this.storage;
    if (!storage) return;

    if (value === undefined) {
      storage.removeItem(key);
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      storage.setItem(key, serialized);
    } catch (error) {
      console.warn(`Failed to serialize ${key} for storage:`, error);
    }
  }

  remove(key: StorageKey): void {
    const storage = this.storage;
    if (!storage) return;

    try {
      storage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key} from storage:`, error);
    }
  }

  clear(): void {
    const storage = this.storage;
    if (!storage) return;

    REGISTERED_KEYS.forEach((key) => {
      try {
        storage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to clear ${key} from storage:`, error);
      }
    });
  }
}

export const storage = new StorageService();
