import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteButtonProps {
    onClick: (e: React.MouseEvent) => void;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function DeleteButton({ onClick, size = 'md', className = '' }: DeleteButtonProps) {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-7 w-7',
        lg: 'h-8 w-8'
    };

    const iconSizes = {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
        lg: 'h-5 w-5'
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className={`${sizeClasses[size]} rounded-lg bg-red-500/10 hover:bg-red-500/20 text-white border border-red-500/20 shrink-0 ${className}`}
            onClick={(e) => {
                e.stopPropagation();
                onClick(e);
            }}
        >
            <Trash2 className={iconSizes[size]} />
        </Button>
    );
}
