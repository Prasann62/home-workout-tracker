import { useEffect, useState } from 'react';

export default function MotivationalToast({ message, duration = 2500, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 200);
    }, duration);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;

  return (
    <div className={`motivational-toast ${visible ? 'toast-visible' : 'toast-hidden'}`}>
      {message}
    </div>
  );
}
