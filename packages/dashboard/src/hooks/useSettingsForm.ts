'use client';

import { useState, useCallback, useMemo } from 'react';
import { ZodSchema, ZodError } from 'zod';

export interface UseSettingsFormOptions<T> {
    schema?: ZodSchema<T>;
    onSave?: (value: T) => Promise<boolean>;
}

export interface UseSettingsFormReturn<T> {
    value: T;
    setValue: (value: T | ((prev: T) => T)) => void;
    updateField: <K extends keyof T>(field: K, fieldValue: T[K]) => void;
    errors: Partial<Record<keyof T, string>>;
    isDirty: boolean;
    isValid: boolean;
    isSaving: boolean;
    validate: () => boolean;
    save: () => Promise<boolean>;
    reset: () => void;
    markSaved: () => void;
}

function formatZodErrors<T>(error: ZodError): Partial<Record<keyof T, string>> {
    const formatted: Partial<Record<keyof T, string>> = {};
    for (const issue of error.issues) {
        const path = issue.path.join('.') as keyof T;
        if (!formatted[path]) {
            formatted[path] = issue.message;
        }
    }
    return formatted;
}

function deepEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

function deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

export function useSettingsForm<T extends Record<string, unknown>>(
    initialValue: T,
    options: UseSettingsFormOptions<T> = {}
): UseSettingsFormReturn<T> {
    const { schema, onSave } = options;

    const [value, setValueState] = useState<T>(() => deepClone(initialValue));
    const [original, setOriginal] = useState<T>(() => deepClone(initialValue));
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [isSaving, setIsSaving] = useState(false);

    const isDirty = useMemo(() => !deepEqual(value, original), [value, original]);

    const isValid = useMemo(() => {
        if (!schema) return true;
        const result = schema.safeParse(value);
        return result.success;
    }, [schema, value]);

    const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
        if (typeof newValue === 'function') {
            setValueState(prev => (newValue as (prev: T) => T)(prev));
        } else {
            setValueState(newValue);
        }
    }, []);

    const updateField = useCallback(<K extends keyof T>(field: K, fieldValue: T[K]) => {
        setValueState(prev => ({ ...prev, [field]: fieldValue }));
        // Clear error for this field when it changes
        setErrors(prev => {
            if (prev[field]) {
                const { [field]: _, ...rest } = prev;
                return rest as Partial<Record<keyof T, string>>;
            }
            return prev;
        });
    }, []);

    const validate = useCallback((): boolean => {
        if (!schema) return true;

        const result = schema.safeParse(value);
        if (!result.success) {
            setErrors(formatZodErrors<T>(result.error));
            return false;
        }
        setErrors({});
        return true;
    }, [schema, value]);

    const save = useCallback(async (): Promise<boolean> => {
        if (!validate()) return false;
        if (!onSave) return true;

        setIsSaving(true);
        try {
            const success = await onSave(value);
            if (success) {
                setOriginal(deepClone(value));
            }
            return success;
        } finally {
            setIsSaving(false);
        }
    }, [validate, onSave, value]);

    const reset = useCallback(() => {
        setValueState(deepClone(original));
        setErrors({});
    }, [original]);

    const markSaved = useCallback(() => {
        setOriginal(deepClone(value));
    }, [value]);

    // Update original when initialValue changes (e.g., after loading from API)
    // This is handled by calling this hook with updated initialValue

    return {
        value,
        setValue,
        updateField,
        errors,
        isDirty,
        isValid,
        isSaving,
        validate,
        save,
        reset,
        markSaved,
    };
}
