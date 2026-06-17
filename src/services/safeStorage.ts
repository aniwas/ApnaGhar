/**
 * Safe local storage manager with in-memory fallback
 * to prevent SecurityError crashes inside sandboxed iframe environments.
 */

const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`safeStorage: localStorage.getItem failed for key "${key}". Using in-memory fallback.`, e);
    }
    return Object.prototype.hasOwnProperty.call(memoryStorage, key) ? memoryStorage[key] : null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn(`safeStorage: localStorage.setItem failed for key "${key}". Using in-memory fallback.`, e);
    }
    memoryStorage[key] = String(value);
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn(`safeStorage: localStorage.removeItem failed for key "${key}". Using in-memory fallback.`, e);
    }
    delete memoryStorage[key];
  },

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
        return;
      }
    } catch (e) {
      console.warn('safeStorage: localStorage.clear failed. Using in-memory fallback.', e);
    }
    for (const key in memoryStorage) {
      if (Object.prototype.hasOwnProperty.call(memoryStorage, key)) {
        delete memoryStorage[key];
      }
    }
  }
};
