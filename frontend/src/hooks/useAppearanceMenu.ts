import { useEffect, useRef, useState } from "react";

export function useAppearanceMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [panelPosition, setPanelPosition] = useState({ top: 16, left: 96 });
  useEffect(() => {
    if (!isOpen) return;
    const positionPanel = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const panelWidth = Math.min(
        panelRef.current?.offsetWidth ?? 230,
        window.innerWidth - 24,
      );
      const left =
        window.innerWidth < 600
          ? 12
          : Math.min(rect.right + 12, window.innerWidth - panelWidth - 12);
      setPanelPosition({
        left: Math.max(12, left),
        top: Math.max(
          12,
          Math.min(
            rect.top,
            window.innerHeight -
              Math.min(
                panelRef.current?.offsetHeight ?? 380,
                window.innerHeight - 24,
              ) -
              12,
          ),
        ),
      });
    };
    positionPanel();
    const observer = new ResizeObserver(positionPanel);
    if (panelRef.current) observer.observe(panelRef.current);
    const sidebar = triggerRef.current?.closest("aside");
    if (sidebar) observer.observe(sidebar);
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
    };
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen]);

  function close() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }
  return { isOpen, setIsOpen, panelRef, triggerRef, panelPosition, close };
}
