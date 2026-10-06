import React, { useEffect, useRef } from 'react';

export default function Dialog({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = false
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onCancel?.();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-desc">
      <div className="dialog-content" ref={dialogRef} tabIndex="-1">
        <h2 id="dialog-title" className="dialog-title">{title}</h2>
        {message && <p id="dialog-desc" className="dialog-message">{message}</p>}
        
        <div className="dialog-actions">
          {onCancel && (
            <button className="btn btn-secondary" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button 
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
