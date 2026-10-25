"use client";

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`font-display px-2 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-all ${
              active
                ? "bg-cyan text-void shadow-[var(--glow-cyan)]"
                : "border-cyan/40 text-cyan hover:bg-cyan/10 border"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
