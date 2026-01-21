'use client';

import { useEffect, useState } from 'react';
import styles from './Message.module.css';

interface MessageProps {
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
    duration?: number;
    onDismiss?: () => void;
}

export function Message({
    type,
    text,
    duration = 3000,
    onDismiss,
}: MessageProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setVisible(false);
                onDismiss?.();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onDismiss]);

    if (!visible) return null;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    return (
        <div className={`${styles.message} ${styles[type]}`}>
            <span className={styles.icon}>{icons[type]}</span>
            <span className={styles.text}>{text}</span>
            {onDismiss && (
                <button
                    type="button"
                    className={styles.dismiss}
                    onClick={() => {
                        setVisible(false);
                        onDismiss();
                    }}
                >
                    ×
                </button>
            )}
        </div>
    );
}
