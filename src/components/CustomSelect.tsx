import { useEffect, useRef, useState, type ReactNode } from 'react';

export type CustomSelectOption = {
  value: string;
  label: ReactNode;
};

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  className?: string;
  title?: string;
  id?: string;
}

export function CustomSelect({ value, options, onChange, className, title, id }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        title={title}
        onClick={() => setOpen((current) => !current)}
        className={`flex items-center justify-between gap-2 text-left ${className ?? ''}`}
      >
        <span className="min-w-0 truncate">{selected?.label ?? 'Select...'}</span>
        <span className="shrink-0 text-current opacity-60">v</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-64 min-w-full overflow-y-auto rounded-lg border border-[color:var(--ui-item-border)] bg-[var(--ui-panel-bg,#111)] p-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm text-white/80 hover:bg-white/10"
            >
              <span className="min-w-0 truncate">{option.label}</span>
              {option.value === value && <span className="shrink-0 text-xs">Selected</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
