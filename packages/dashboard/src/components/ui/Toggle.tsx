'use client';

import styles from './Toggle.module.css';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large';
    label?: string;
    description?: string;
}

export function Toggle({
    checked,
    onChange,
    disabled = false,
    size = 'medium',
    label,
    description,
}: ToggleProps) {
    return (
        <div className={styles.container}>
            {(label || description) && (
                <div className={styles.labelContainer}>
                    {label && <span className={styles.label}>{label}</span>}
                    {description && <span className={styles.description}>{description}</span>}
                </div>
            )}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                className={`${styles.toggle} ${styles[size]} ${checked ? styles.active : ''}`}
                onClick={() => !disabled && onChange(!checked)}
                disabled={disabled}
            >
                <span className={styles.knob} />
            </button>
        </div>
    );
}
