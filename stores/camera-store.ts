import { create } from "zustand";

interface CameraState {
  stream: MediaStream | null;
  isActive: boolean;
  hasPermission: boolean | null;
  facingMode: "user" | "environment";
  error: string | null;

  requestPermission: () => Promise<void>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  toggleFacingMode: () => void;
  setError: (error: string | null) => void;
}

export const useCameraStore = create<CameraState>((set, get) => ({
  stream: null,
  isActive: false,
  hasPermission: null,
  facingMode: "user",
  error: null,

  requestPermission: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      set({ hasPermission: true, error: null });
    } catch {
      set({ hasPermission: false, error: "Camera permission denied" });
    }
  },

  startCamera: async () => {
    const { facingMode } = get();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
      });
      set({ stream, isActive: true, hasPermission: true, error: null });
    } catch {
      set({ error: "Failed to start camera", hasPermission: false });
    }
  },

  stopCamera: () => {
    const { stream } = get();
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    set({ stream: null, isActive: false });
  },

  toggleFacingMode: () => {
    const { facingMode, isActive } = get();
    const newMode = facingMode === "user" ? "environment" : "user";
    set({ facingMode: newMode });
    if (isActive) {
      get().stopCamera();
      get().startCamera();
    }
  },

  setError: (error) => set({ error }),
}));
