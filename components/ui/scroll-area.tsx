import React from 'react';

export function ScrollArea({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={`overflow-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent ${className}`}>
            {children}
        </div>
    );
}
