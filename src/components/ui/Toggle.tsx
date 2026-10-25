"use client";

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="group flex w-full items-center justify-between gap-4 py-1.5 text-left text-sm"
    >
      <span className={checked ? "text-ink" : "text-ink-dim"}>{label}</span>
      <span
        className={`relative h-4 w-9 rounded-full border transition-colors ${
          checked
            ? "border-pink bg-pink/30 shadow-[var(--glow-pink)]"
            : "border-ink-dim/50 bg-transparent"
        }`}
      >
        <span
          className={`absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full transition-all ${
            checked ? "bg-yellow left-5" : "bg-ink-dim left-1"
          }`}
        />
      </span>
    </button>
  );
}
