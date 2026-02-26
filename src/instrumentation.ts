export async function register() {
  // Node.js v25+ exposes a broken global `localStorage` that lacks
  // standard Web Storage methods (getItem/setItem/removeItem) unless
  // --localstorage-file is provided. This crashes any SSR code that
  // references bare `localStorage`. Patch it with a no-op shim.
  if (typeof window === "undefined" && typeof globalThis.localStorage !== "undefined") {
    const storage = globalThis.localStorage;
    if (typeof storage.getItem !== "function") {
      globalThis.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        get length() { return 0; },
        key: () => null,
      } as Storage;
    }
  }
}
