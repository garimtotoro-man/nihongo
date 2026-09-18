'use client';

type Option<T extends string> = { value: T; label: string; hint?: string };
type Props<T extends string> = { label: string; options: Option<T>[]; value: T; onChange: (v: T) => void };

/** 두세 값 중 하나 고르기. 선택지를 나란히 놓고 고른 쪽만 강조한다. */
export function Segment<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={
              'rounded-2xl border px-4 py-4 text-left transition-colors ' +
              (on ? 'border-ink bg-ink text-paper' : 'border-line bg-paper text-ink active:bg-sand')
            }
          >
            <span className="block text-base font-semibold">{o.label}</span>
            {o.hint && <span className={'mt-0.5 block text-xs ' + (on ? 'text-paper/70' : 'text-mute')}>{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}
