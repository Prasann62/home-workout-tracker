// ============================================================
// FORM FEEDBACK — Color-coded message banner
// ============================================================
import React, { useEffect, useRef } from 'react';
import { FEEDBACK_TYPE } from '../utils/poseUtils.js';

/**
 * Classify feedback message into a visual tone.
 * Looks for keywords to determine color coding.
 */

function getTone(type) {
  switch (type) {
    case FEEDBACK_TYPE.GOOD: return 'good';
    case FEEDBACK_TYPE.WARNING:
    case FEEDBACK_TYPE.FORM: return 'warning';
    case FEEDBACK_TYPE.ERROR:
    case FEEDBACK_TYPE.CAMERA: return 'error';
    default: return 'neutral';
  }
}

export default function FormFeedback({ feedback }) {
  const prevMsg = useRef(feedback?.message);
  const ref = useRef(null);

  // Re-trigger slide animation on message change
  useEffect(() => {
    if (feedback?.message !== prevMsg.current && ref.current) {
      ref.current.style.animation = 'none';
      void ref.current.offsetHeight;
      ref.current.style.animation = '';
    }
    prevMsg.current = feedback?.message;
  }, [feedback?.message]);

  if (!feedback || !feedback.message) return null;

  const tone = getTone(feedback.type);

  return (
    <div
      ref={ref}
      className={`form-feedback ${tone}`}
      role="status"
      aria-live="polite"
      id="form-feedback-banner"
    >
      {feedback.type === FEEDBACK_TYPE.FORM ? '⚠️ ' : ''}
      {feedback.type === FEEDBACK_TYPE.CAMERA ? '📷 ' : ''}
      {feedback.message}
    </div>
  );
}
