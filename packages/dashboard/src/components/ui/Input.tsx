'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, error, fullWidth = true, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={`${styles.input} ${error ? styles.error : ''} ${fullWidth ? styles.fullWidth : ''} ${className || ''}`}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';
