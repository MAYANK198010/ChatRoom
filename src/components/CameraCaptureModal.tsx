import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface CameraCaptureModalProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ onCapture, onClose }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setHasError(false);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } else {
        setHasError(true);
      }
    } catch (err) {
      console.warn('Camera stream could not start:', err);
      setHasError(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-[#111b21] border border-gray-800 rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between text-gray-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-sm">Take Photo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder or Preview */}
        <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
          {hasError ? (
            <div className="p-6 text-center text-gray-400 space-y-2">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-sm font-medium">Camera access unavailable in this environment.</p>
              <p className="text-xs text-gray-500">You can use photo attachment to upload pictures directly.</p>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls */}
        <div className="p-5 bg-[#0b141a] flex items-center justify-around border-t border-gray-800">
          {capturedImage ? (
            <>
              <button
                onClick={handleRetake}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2.5 bg-[#00a884] hover:bg-[#06cf9c] text-gray-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition cursor-pointer"
              >
                <Check className="w-4 h-4" /> Send Photo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleCameraFacing}
                className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition cursor-pointer"
                title="Switch Camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                onClick={takePhoto}
                disabled={hasError}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 hover:scale-105 active:scale-95 transition cursor-pointer disabled:opacity-40"
              >
                <div className="w-full h-full bg-white rounded-full" />
              </button>

              <div className="w-10" />
            </>
          )}
        </div>

      </div>
    </div>
  );
};
