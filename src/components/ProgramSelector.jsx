import React, { useState } from 'react';
import { PROGRAMS, programToCustomPlan } from '../data/programs.js';
import { saveCustomPlan } from '../data/challengePlan.js';
import Dialog from './ui/Dialog.jsx';

export default function ProgramSelector({ onClose, onProgramStarted }) {
  const [dialogState, setDialogState] = useState({ isOpen: false });

  const handleStartProgram = (program) => {
    setDialogState({
      isOpen: true,
      title: 'Start Program?',
      message: `This will replace your current active plan with "${program.name}".`,
      confirmText: 'Start Program',
      danger: true,
      onConfirm: () => {
        const plan = programToCustomPlan(program, 1); // Start week 1
        if (plan) {
          saveCustomPlan(plan);
          setDialogState({ isOpen: false });
          if (onProgramStarted) onProgramStarted(plan);
        }
      },
      onCancel: () => setDialogState({ isOpen: false })
    });
  };

  return (
    <div className="prog-container">
      <header className="prog-header">
        <button className="prog-back-btn" onClick={onClose}>← BACK</button>
        <h1 className="prog-title">PROGRAMS</h1>
        <p className="prog-subtitle">Built-in expert routines</p>
      </header>

      <div className="prog-list">
        {PROGRAMS.map(prog => (
          <div key={prog.id} className="prog-card">
            <div className="prog-card-header">
              <span className="prog-emoji">{prog.emoji}</span>
              <div className="prog-info">
                <h2>{prog.name}</h2>
                <div className="prog-meta">
                  <span className={`prog-diff prog-diff--${prog.difficulty.toLowerCase()}`}>{prog.difficulty}</span>
                  <span className="prog-sep">·</span>
                  <span>{prog.daysPerWeek}×/wk</span>
                  <span className="prog-sep">·</span>
                  <span>{prog.durationWeeks}wk</span>
                </div>
              </div>
            </div>
            <p className="prog-desc">{prog.description}</p>
            <button className="prog-start-btn" onClick={() => handleStartProgram(prog)}>
              START PROGRAM
            </button>
          </div>
        ))}
      </div>
      <Dialog {...dialogState} />
    </div>
  );
}
