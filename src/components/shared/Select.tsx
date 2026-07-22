import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T extends string | number = string> {
    value: T;
    label: string;
    description?: string;
}

interface SelectProps<T extends string | number = string> {
    value: T;
    onChange: (value: T) => void;
    options: SelectOption<T>[];
    className?: string;
    buttonClassName?: string;
    placeholder?: string;
}

export default function Select<T extends string | number = string>({
    value,
    onChange,
    options,
    className = '',
    buttonClassName = '',
    placeholder = 'Select option',
}: SelectProps<T>) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    const isFullWidth = className.includes('w-full') || className.includes('block');

    return (
        <div ref={containerRef} className={`relative ${isFullWidth ? 'flex w-full' : 'inline-flex'} ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`bg-surface border border-border-subtle rounded-xl px-3.5 py-2 text-xs text-txt-primary font-bold outline-none flex items-center justify-between gap-2.5 transition-all cursor-pointer hover:border-brand/50 active:scale-95 ${isFullWidth ? 'w-full' : ''} ${buttonClassName}`}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-txt-secondary shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-brand' : ''}`} />
            </button>

            {open && (
                <div className="absolute left-0 top-full mt-1.5 min-w-full w-max max-w-[320px] z-50 select-dropdown-popover border border-border-subtle rounded-xl p-1.5 shadow-2xl animate-fadeIn space-y-0.5">
                    {options.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={String(opt.value)}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${isSelected
                                    ? 'bg-brand/15 text-brand border border-brand/20 font-bold'
                                    : 'text-txt-secondary hover:text-txt-primary hover:bg-white/[0.06]'
                                }`}
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="truncate">{opt.label}</span>
                                    {opt.description && (
                                        <span className="text-[10px] font-normal text-txt-secondary/70 truncate">{opt.description}</span>
                                    )}
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-brand" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
