'use client';

import { ReactNode } from 'react';
import styles from './FormSection.module.css';

interface FormSectionProps {
    title: string;
    description?: string;
    icon?: string;
    children: ReactNode;
    collapsible?: boolean;
    defaultExpanded?: boolean;
}

export function FormSection({
    title,
    description,
    icon,
    children,
}: FormSectionProps) {
    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    {icon && <span className={styles.icon}>{icon}</span>}
                    <h2 className={styles.title}>{title}</h2>
                </div>
                {description && <p className={styles.description}>{description}</p>}
            </div>
            <div className={styles.content}>
                {children}
            </div>
        </section>
    );
}
