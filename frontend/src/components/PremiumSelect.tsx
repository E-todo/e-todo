import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Check, NavArrowDown } from "iconoir-react";

type Option = { value: string; label: string };
type Props = { label: string; value: string; options: Option[]; onChange: (value: string) => void };

export default function PremiumSelect({ label, value, options, onChange }: Props) {
  const listId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = options.find(option => option.value === value) ?? options[0];
  useEffect(() => {
    if (!open) return;
    optionRefs.current[Math.max(0, options.findIndex(option => option.value === value))]?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); root.current?.querySelector<HTMLButtonElement>(".premium-select-trigger")?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open, options, value]);
  const onOptionKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
      optionRefs.current[next]?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
      trigger.current?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      optionRefs.current[event.key === "Home" ? 0 : options.length - 1]?.focus();
    }
  };
  return <div className={`premium-select ${open ? "is-open" : ""}`} ref={root}>
    <button ref={trigger} type="button" disabled={!options.length} aria-controls={open ? listId : undefined} className="premium-select-trigger" aria-label={label} aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen(!open)} onKeyDown={event => { if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) { event.preventDefault(); setOpen(true); window.requestAnimationFrame(() => optionRefs.current[options.findIndex(o => o.value === value)]?.focus()); } }}>
      <span>{selected?.label ?? label}</span><NavArrowDown width={16} height={16} aria-hidden="true" />
    </button>
    {open && <div id={listId} className="premium-select-options" role="listbox" aria-label={label}>
      {options.map((option, index) => <button ref={element => { optionRefs.current[index] = element; }} onKeyDown={event => onOptionKeyDown(event, index)} type="button" role="option" aria-selected={option.value === value} key={option.value} className={option.value === value ? "selected" : ""} onClick={() => { onChange(option.value); setOpen(false); trigger.current?.focus(); }}>
        <span>{option.label}</span>{option.value === value && <Check width={17} height={17} aria-hidden="true" />}
      </button>)}
    </div>}
  </div>;
}
