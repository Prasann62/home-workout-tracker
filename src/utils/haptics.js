// ============================================================
// HAPTICS SERVICE
// Centralized vibration logic with safety checks
// ============================================================

export const Haptics = {
  isEnabled: true,

  _vibrate(pattern) {
    if (!this.isEnabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore devices that block vibration or throw errors
      }
    }
  },

  repCounted() {
    this._vibrate(50); // Short tap
  },

  warning() {
    this._vibrate([100, 50, 100]); // Double buzz for form warnings
  },

  setComplete() {
    this._vibrate([200, 100, 200, 100, 400]); // Victory fanfare
  },

  workoutComplete() {
    this._vibrate([300, 100, 300, 100, 300, 100, 600]); 
  },

  restStart() {
    this._vibrate(100);
  },

  restComplete() {
    this._vibrate([400, 200, 400]);
  },

  setEnabled(val) {
    this.isEnabled = !!val;
  }
};
