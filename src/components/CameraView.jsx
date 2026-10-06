import { useRef, useCallback, useEffect } from 'react';
import { Pose } from '@mediapipe/pose';
import { drawSkeleton } from '../utils/poseUtils.js';

export default function CameraView({ isActive, onResults, onLoading, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const activeRef = useRef(false);
  const mountedRef = useRef(true);
  const isProcessingRef = useRef(false);
  const playPromiseRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const drawFrame = useCallback((canvas, landmarks) => {
    drawSkeleton(canvas, landmarks);
  }, []);

  const loop = useCallback(async () => {
    if (!activeRef.current || !poseRef.current || !videoRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const w = video.videoWidth || canvas.getBoundingClientRect().width;
      const h = video.videoHeight || canvas.getBoundingClientRect().height;
      if (w > 0 && h > 0) {
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
      }
    }
    if (!isProcessingRef.current) {
      isProcessingRef.current = true;
      try {
        await poseRef.current.send({ image: video });
      } catch (err) {
        console.warn('Pose estimation frame error:', err);
      } finally {
        isProcessingRef.current = false;
      }
    }
    if (activeRef.current) rafRef.current = requestAnimationFrame(loop);
  }, []);

  const initPose = useCallback(() => {
    const PoseConstructor = Pose || window.Pose;
    if (!PoseConstructor) {
      if (mountedRef.current) onError?.('MediaPipe Pose engine not available. Please refresh or check connection.');
      return;
    }
    try {
      const pose = new PoseConstructor({
        locateFile: (f) => `/mediapipe/pose/${f}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults((results) => {
        if (!activeRef.current) return;
        const landmarks = results.poseLandmarks;
        drawFrame(canvasRef.current, landmarks);
        onResults?.(landmarks, performance.now());
      });
      poseRef.current = pose;
    } catch (err) {
      console.error('Failed to initialize MediaPipe Pose:', err);
      if (mountedRef.current) onError?.(`MediaPipe error: ${err.message}`);
    }
  }, [drawFrame, onResults, onError]);

  const startCamera = useCallback(async () => {
    if (!mountedRef.current) return;
    onLoading?.(true);
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
    } catch (err) {
      if (!mountedRef.current) return;
      onLoading?.(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
        onError?.('Camera permission denied. Tap Allow when your browser asks.');
      else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')
        onError?.('No camera found on this device.');
      else if (err.name === 'NotReadableError' || err.name === 'TrackStartError')
        onError?.('Camera busy — close other apps using the camera and try again.');
      else if (err.name === 'OverconstrainedError')
        onError?.('Camera resolution not supported. Try a different device.');
      else
        onError?.(`Camera error: ${err.message}`);
      return;
    }
    if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) { stream.getTracks().forEach(t => t.stop()); onLoading?.(false); return; }
    video.srcObject = stream;
    try {
      playPromiseRef.current = video.play();
      await playPromiseRef.current;
      playPromiseRef.current = null;
    } catch (err) {
      playPromiseRef.current = null;
      if (err.name === 'AbortError' || err.name === 'NotAllowedError' ||
          (err.message && err.message.includes('interrupted'))) {
        if (mountedRef.current) onLoading?.(false);
        return;
      }
      if (mountedRef.current) {
        onLoading?.(false);
        onError?.(`Video playback error: ${err.message}`);
      }
      return;
    }
    if (!activeRef.current && !isActive) {
      stream.getTracks().forEach(t => t.stop());
      if (mountedRef.current) onLoading?.(false);
      return;
    }
    initPose();
    activeRef.current = true;
    rafRef.current = requestAnimationFrame(loop);
    if (mountedRef.current) onLoading?.(false);
  }, [initPose, loop, onLoading, onError, isActive]);

  const stopCamera = useCallback(async () => {
    activeRef.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    const video = videoRef.current;
    if (video) {
      if (playPromiseRef.current !== null) {
        try { await playPromiseRef.current; } catch {}
      }
      try { video.pause(); } catch {}
      video.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      try { canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); } catch {}
    }
    setTimeout(() => { poseRef.current = null; }, 150);
  }, []);

  useEffect(() => {
    if (isActive) startCamera();
    else stopCamera();
    return () => { stopCamera(); };
  }, [isActive]);

  return (
    <div className="camera-wrapper">
      <video
        ref={videoRef}
        className="camera-video"
        playsInline
        muted
        autoPlay
        x-webkit-airplay="deny"
        aria-label="Live camera feed for pose detection"
      />
      <canvas
        ref={canvasRef}
        className="camera-canvas"
        aria-hidden="true"
      />
    </div>
  );
}
