'use client';

import { ReactNode } from 'react';
import styles from './FormField.module.css';

interface FormFieldProps {
    label: string;
    description?: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
    horizontal?: boolean;
}

export function FormField({
    label,
    description,
    error,
    required = false,
    children,
    horizontal = false,
}: FormFieldProps) {
    return (
        <div className={`${styles.field} ${horizontal ? styles.horizontal : ''} ${error ? styles.hasError : ''}`}>
            <div className={styles.labelContainer}>
                <label className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
                {description && <span className={styles.description}>{description}</span>}
            </div>
            <div className={styles.inputContainer}>
                {children}
                {error && <span className={styles.error}>{error}</span>}
            </div>
        </div>
    );
}
