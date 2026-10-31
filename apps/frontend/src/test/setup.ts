import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Node 26 exposes a disabled global `localStorage`, which shadows jsdom's.
// Install a small in-memory implementation so the auth provider can exercise
// its real persistence path in tests.
const store = new Map<string, string>();

const localStorageMock: Storage = {
  get length() {
    return store.size;
  },
  clear: () => store.clear(),
  getItem: (key) => store.get(key) ?? null,
  key: (index) => Array.from(store.keys())[index] ?? null,
  removeItem: (key) => {
    store.delete(key);
  },
  setItem: (key, value) => {
    store.set(key, String(value));
  },
};

vi.stubGlobal('localStorage', localStorageMock);
