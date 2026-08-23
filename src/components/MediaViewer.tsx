import React from 'react';
import { X, Download, ZoomIn, ZoomOut, Share2 } from 'lucide-react';

interface MediaViewerProps {
  mediaUrl: string;
  fileName?: string;
  senderName?: string;
  timestamp?: number;
  onClose: () => void;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  mediaUrl,
  fileName,
  senderName,
  timestamp,
  onClose
}) => {
  const [zoom, setZoom] = React.useState(1);

  const formattedDate = timestamp
    ? new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = fileName || 'CipherChat_Media.jpg';
    link.target = '_blank';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between animate-fade-in select-none">
      
      {/* Top Action Bar */}
      <div className="p-4 flex items-center justify-between text-white bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <div>
            <div className="text-sm font-semibold text-gray-100">{senderName || 'Media'}</div>
            {formattedDate && <div className="text-xs text-gray-400">{formattedDate}</div>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.3, 3))}
            className="p-2 hover:bg-white/10 rounded-full transition text-gray-300 hover:text-white cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.3, 0.7))}
            className="p-2 hover:bg-white/10 rounded-full transition text-gray-300 hover:text-white cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-white/10 rounded-full transition text-gray-300 hover:text-white cursor-pointer"
            title="Download Media"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <img
          src={mediaUrl}
          alt={fileName || 'Preview'}
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease-out' }}
          className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* Bottom Info Bar */}
      <div className="p-4 text-center text-xs text-gray-400 bg-gradient-to-t from-black/80 to-transparent">
        {fileName && <span className="font-mono">{fileName}</span>}
      </div>

    </div>
  );
};
