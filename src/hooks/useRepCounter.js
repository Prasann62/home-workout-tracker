// ============================================================
// USE REP COUNTER — Sensor-based Rep Counting Custom Hook
// ============================================================
//
// Features:
// 1. Accelerometer subscription at ~50Hz (20ms interval)
// 2. Magnitude computation: sqrt(x^2 + y^2 + z^2)
// 3. Signal smoothing via Exponential Moving Average (EMA)
// 4. Auto-calibration phase (~2 seconds baseline sampling)
// 5. Peak detection with hysteresis (upThreshold -> downThreshold)
// 6. Minimum refractory interval (minRepIntervalMs) to filter noise spikes
// 7. Expo Haptics integration on counted reps
// 8. Safe imports & fallbacks for Web/Capacitor/Expo environments
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';

// Safe require for Expo dependencies (prevents crash if tested in non-Expo environment)
let Accelerometer = null;
let Haptics = null;

try {
  Accelerometer = require('expo-sensors').Accelerometer;
} catch (e) {
  // expo-sensors not available in current runtime
}

try {
  Haptics = require('expo-haptics');
} catch (e) {
  // expo-haptics not available in current runtime
}

// Exercise Threshold Presets (deltas relative to baseline magnitude ~1.0g)
export const EXERCISE_PRESETS = {
  bicep_curl: {
    name: 'Bicep Curl',
    upThresholdDelta: 0.22,
    downThresholdDelta: 0.08,
    minRepIntervalMs: 500,
    smoothingAlpha: 0.25,
  },
  squat: {
    name: 'Squat',
    upThresholdDelta: 0.35,
    downThresholdDelta: 0.12,
    minRepIntervalMs: 650,
    smoothingAlpha: 0.20,
  },
  pushup: {
    name: 'Push-Up',
    upThresholdDelta: 0.28,
    downThresholdDelta: 0.10,
    minRepIntervalMs: 500,
    smoothingAlpha: 0.22,
  },
  generic: {
    name: 'Generic Exercise',
    upThresholdDelta: 0.30,
    downThresholdDelta: 0.10,
    minRepIntervalMs: 500,
    smoothingAlpha: 0.20,
  },
};

/**
 * Sensor Rep Counter Custom Hook
 * @param {'bicep_curl'|'squat'|'pushup'|'generic'} exerciseType
 * @param {Object} customOptions Override default preset options
 */
export function useRepCounter(exerciseType = 'generic', customOptions = {}) {
  const preset = EXERCISE_PRESETS[exerciseType] || EXERCISE_PRESETS.generic;
  const config = { ...preset, ...customOptions };

  // State
  const [repCount, setRepCount] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('idle'); // 'idle' | 'up' | 'down'
  const [isTracking, setIsTracking] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0); // 0 to 1
  const [baseline, setBaseline] = useState(1.0);

  // Dynamic Thresholds computed after calibration
  const [thresholds, setThresholds] = useState({
    upThreshold: 1.30,
    downThreshold: 1.10,
  });

  // Internal Refs (avoid stale closures in high-frequency sensor callback)
  const subscriptionRef = useRef(null);
  const smoothedMagRef = useRef(null);
  const phaseRef = useRef('idle');
  const lastRepTimeRef = useRef(0);
  const calibrationSamplesRef = useRef([]);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Trigger Haptic Feedback
  const triggerHaptic = useCallback(() => {
    try {
      if (Haptics && Haptics.impactAsync && Haptics.ImpactFeedbackStyle) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
      }
    } catch (e) {}
  }, []);

  // Process Acceleration Sample (runs ~50 times per second)
  const handleSensorData = useCallback((data) => {
    if (!data) return;
    const { x = 0, y = 0, z = 0 } = data;

    // 1. Raw Acceleration Magnitude
    const rawMag = Math.sqrt(x * x + y * y + z * z);

    // 2. Calibration Sampling Phase (~2 seconds / ~100 samples)
    if (calibrationSamplesRef.current !== null) {
      const samples = calibrationSamplesRef.current;
      samples.push(rawMag);
      setCalibrationProgress(Math.min(1, samples.length / 100));

      if (samples.length >= 100) {
        // Calculate Baseline Mean & Noise Variance
        const avgBaseline = samples.reduce((a, b) => a + b, 0) / samples.length;
        const variance = samples.reduce((sq, n) => sq + Math.pow(n - avgBaseline, 2), 0) / samples.length;
        const stdDev = Math.sqrt(variance);

        const currentConfig = configRef.current;
        const calcUp = avgBaseline + Math.max(currentConfig.upThresholdDelta, stdDev * 2.5);
        const calcDown = avgBaseline + currentConfig.downThresholdDelta;

        setBaseline(avgBaseline);
        setThresholds({ upThreshold: calcUp, downThreshold: calcDown });
        setIsCalibrating(false);
        calibrationSamplesRef.current = null; // Exit calibration
      }
      return;
    }

    // 3. Exponential Moving Average (EMA) Smoothing
    const alpha = configRef.current.smoothingAlpha || 0.20;
    if (smoothedMagRef.current === null) {
      smoothedMagRef.current = rawMag;
    } else {
      smoothedMagRef.current = alpha * rawMag + (1 - alpha) * smoothedMagRef.current;
    }

    const smoothed = smoothedMagRef.current;
    const now = Date.now();

    // 4. Hysteresis Peak Detection & State Machine
    const { upThreshold, downThreshold } = thresholds;
    const minInterval = configRef.current.minRepIntervalMs || 500;

    if (phaseRef.current === 'idle' || phaseRef.current === 'down') {
      if (smoothed >= upThreshold) {
        phaseRef.current = 'up';
        setCurrentPhase('up');
      }
    } else if (phaseRef.current === 'up') {
      if (smoothed <= downThreshold) {
        // Enforce refractory period between reps
        if (now - lastRepTimeRef.current >= minInterval) {
          lastRepTimeRef.current = now;
          phaseRef.current = 'down';
          setCurrentPhase('down');
          setRepCount((c) => c + 1);
          triggerHaptic();
        }
      }
    }
  }, [thresholds, triggerHaptic]);

  // Start Tracking & Initiate Auto-Calibration
  const startTracking = useCallback(async () => {
    if (isTracking) return;

    // Reset Tracking State
    setRepCount(0);
    setCurrentPhase('idle');
    phaseRef.current = 'idle';
    smoothedMagRef.current = null;
    lastRepTimeRef.current = 0;
    calibrationSamplesRef.current = [];
    setIsCalibrating(true);
    setCalibrationProgress(0);

    setIsTracking(true);

    if (Accelerometer) {
      try {
        await Accelerometer.setUpdateInterval(20); // ~50Hz
        subscriptionRef.current = Accelerometer.addListener(handleSensorData);
      } catch (e) {
        console.warn('Failed to subscribe to expo-sensors Accelerometer:', e);
      }
    } else if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
      // Fallback: Web DeviceMotion API
      const motionHandler = (event) => {
        const acc = event.accelerationIncludingGravity || event.acceleration;
        if (acc) {
          // Normalize to g-force (~9.81 m/s^2)
          handleSensorData({
            x: (acc.x || 0) / 9.81,
            y: (acc.y || 0) / 9.81,
            z: (acc.z || 0) / 9.81,
          });
        }
      };
      window.addEventListener('devicemotion', motionHandler);
      subscriptionRef.current = { remove: () => window.removeEventListener('devicemotion', motionHandler) };
    }
  }, [isTracking, handleSensorData]);

  // Stop Tracking & Cleanup Sensor Subscription
  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.remove();
      } catch (e) {}
      subscriptionRef.current = null;
    }
    setIsTracking(false);
    setIsCalibrating(false);
    calibrationSamplesRef.current = null;
    setCurrentPhase('idle');
    phaseRef.current = 'idle';
  }, []);

  // Reset Rep Count
  const reset = useCallback(() => {
    setRepCount(0);
    setCurrentPhase('idle');
    phaseRef.current = 'idle';
    lastRepTimeRef.current = 0;
  }, []);

  // Cleanup on Unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    repCount,
    currentPhase,
    isTracking,
    isCalibrating,
    calibrationProgress,
    baseline,
    thresholds,
    startTracking,
    stopTracking,
    reset,
  };
}
