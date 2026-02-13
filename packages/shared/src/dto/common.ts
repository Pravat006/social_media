
/**
 * Converts Date fields to ISO strings for network transmission
 */
export type Serialize<T> = {
    [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | null
    ? string | null
    : T[K] extends Date | undefined
    ? string | undefined
    : T[K] extends Date | null | undefined
    ? string | null | undefined
    : T[K];
};
