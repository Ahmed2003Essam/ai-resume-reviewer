import type { z } from "zod";

type ReadStorageOptions = {
    removeInvalid?: boolean;
};

// Browser storage is unavailable during server rendering, so callers receive null.
function getLocalStorage(): Storage | null {
    if (typeof window === "undefined") return null;

    return window.localStorage;
}

/**
 * Reads JSON from localStorage and validates it before returning typed data.
 * Malformed or outdated values are removed by default so they cannot break the UI.
 */
export function readStorage<T>(
    key: string,
    schema: z.ZodType<T>,
    { removeInvalid = true }: ReadStorageOptions = {}
): T | null {
    const storage = getLocalStorage();

    if (!storage) return null;

    const removeInvalidValue = () => {
        if (removeInvalid) storage.removeItem(key);
    };

    try {
        const savedValue = storage.getItem(key);

        if (!savedValue) return null;

        const result = schema.safeParse(JSON.parse(savedValue));

        if (!result.success) {
            removeInvalidValue();
            return null;
        }

        return result.data;
    } catch {
        removeInvalidValue();
        return null;
    }
}

/** Serializes a value safely and reports whether persistence succeeded. */
export function writeStorage<T>(key: string, value: T): boolean {
    const storage = getLocalStorage();

    if (!storage) return false;

    try {
        storage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

/** Removes one application value without affecting unrelated browser storage. */
export function removeStorage(key: string): void {
    getLocalStorage()?.removeItem(key);
}
