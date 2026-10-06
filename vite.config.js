import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // MediaPipe WASM files need special handling
  optimizeDeps: {
    exclude: ['@mediapipe/pose', '@mediapipe/camera_utils', '@mediapipe/drawing_utils'],
  },
  server: {
    headers: {
      // Required for SharedArrayBuffer (used by MediaPipe WASM)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
