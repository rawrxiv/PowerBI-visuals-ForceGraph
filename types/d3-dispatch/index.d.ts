// Simplified d3-dispatch type definitions compatible with the TypeScript version used by pbiviz
// Based on the public API from d3-dispatch 3.x.

export interface Dispatch<T extends object> {
    /**
     * Invokes each registered callback for the specified type using Function.apply semantics.
     */
    apply(type: string, that?: T, args?: any[]): void;

    /**
     * Invokes each registered callback for the specified type using Function.call semantics.
     */
    call(type: string, that?: T, ...args: any[]): void;

    /**
     * Returns a copy of this dispatch object.
     */
    copy(): Dispatch<T>;

    /**
     * Returns the callback for the specified typenames, if any.
     */
    on(typenames: string): ((this: T, ...args: any[]) => void) | undefined;

    /**
     * Adds or removes the callback for the specified typenames.
     */
    on(typenames: string, callback: null | ((this: T, ...args: any[]) => void)): this;
}

/**
 * Creates a new dispatch for the specified event types.
 */
export function dispatch<T extends object>(...types: string[]): Dispatch<T>;
