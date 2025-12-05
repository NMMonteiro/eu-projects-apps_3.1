import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';

const SheetContext = createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
} | null>(null);

export function Sheet({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : uncontrolledOpen;
    const setIsOpen = isControlled ? onOpenChange! : setUncontrolledOpen;

    return (
        <SheetContext.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
            {children}
        </SheetContext.Provider>
    );
}

export function SheetTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
    const context = useContext(SheetContext);
    if (!context) throw new Error("SheetTrigger must be used within a Sheet");

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
                children.props.onClick?.(e);
                context.setOpen(true);
            }
        });
    }

    return (
        <button onClick={() => context.setOpen(true)}>
            {children}
        </button>
    );
}

interface SheetContentProps {
    children: React.ReactNode;
    side?: 'left' | 'right' | 'top' | 'bottom';
    className?: string;
}

export function SheetContent({ children, side = 'right', className }: SheetContentProps) {
    const context = useContext(SheetContext);
    if (!context) throw new Error("SheetContent must be used within a Sheet");

    if (!context.open) return null;

    const sideClasses = {
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right: 'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom: 'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
    };

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-all duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in"
                onClick={() => context.setOpen(false)}
                data-state={context.open ? 'open' : 'closed'}
            />
            {/* Content */}
            <div
                className={`fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out ${sideClasses[side]} ${className}`}
                data-state={context.open ? 'open' : 'closed'}
            >
                <div className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                    <button onClick={() => context.setOpen(false)}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export function SheetHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={`flex flex-col space-y-2 text-center sm:text-left ${className}`}>{children}</div>;
}

export function SheetTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return <h2 className={`text-lg font-semibold text-foreground ${className}`}>{children}</h2>;
}

export function SheetDescription({ children, className }: { children: React.ReactNode; className?: string }) {
    return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
}
