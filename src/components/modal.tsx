'use client';
import { useEffect, useRef, type ReactNode } from 'react';

export function Modal({ title, closeLabel, onClose, children, wide = false, fullscreen = false }: {
  title: string; closeLabel: string; onClose: () => void; children: ReactNode; wide?: boolean; fullscreen?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const node = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    node?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      node?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} className={fullscreen ? 'modal modal-fullscreen' : wide ? 'modal modal-wide' : 'modal'} aria-label={title}
    onCancel={(event) => { event.preventDefault(); closeRef.current(); }}
    onClick={(event) => { if (event.target === event.currentTarget) closeRef.current(); }}>
    <div className="modal-inner">
      <button autoFocus className="close-button" aria-label={closeLabel} onClick={onClose}>×</button>
      {children}
    </div>
  </dialog>;
}
