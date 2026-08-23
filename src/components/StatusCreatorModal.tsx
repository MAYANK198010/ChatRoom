import React, { useState, useRef } from 'react';
import { Type, Image, X, Send, Palette, Sparkles, Upload } from 'lucide-react';
import { StatusItem } from '../types';

interface StatusCreatorModalProps {
  onPostStatus: (status: Partial<StatusItem>) => void;
  onClose: () => void;
}

const BG_GRADIENTS = [
  '#075E54', // WhatsApp Teal
  '#128C7E', // WhatsApp Emerald
  '#7C3AED', // Violet
  '#DB2777', // Pink
  '#D97706', // Amber
  '#2563EB', // Blue
  '#DC2626', // Red
  '#111827'  // Charcoal
];

export const StatusCreatorModal: React.FC<StatusCreatorModalProps> = ({ onPostStatus, onClose }) => {
  const [tab, setTab] = useState<'text' | 'image'>('text');
  const [textContent, setTextContent] = useState('');
  const [bgColorIndex, setBgColorIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cycleBgColor = () => {
    setBgColorIndex((prev) => (prev + 1) % BG_GRADIENTS.length);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = () => {
    if (tab === 'text') {
      if (!textContent.trim()) return;
      onPostStatus({
        type: 'text',
        content: textContent.trim(),
        backgroundColor: BG_GRADIENTS[bgColorIndex]
      });
    } else {
      if (!imageUrl) return;
      onPostStatus({
        type: 'image',
        content: imageUrl,
        caption: caption.trim()
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fade-in">
      
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between z-20 text-white">
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-800/80 p-1 rounded-2xl border border-gray-700">
          <button
            onClick={() => setTab('text')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              tab === 'text' ? 'bg-[#00a884] text-gray-950 shadow-md' : 'text-gray-300 hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Text</span>
          </button>

          <button
            onClick={() => setTab('image')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              tab === 'image' ? 'bg-[#00a884] text-gray-950 shadow-md' : 'text-gray-300 hover:text-white'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Photo</span>
          </button>
        </div>

        {tab === 'text' ? (
          <button
            onClick={cycleBgColor}
            className="p-2 hover:bg-white/10 rounded-full transition cursor-pointer text-emerald-400"
            title="Change Background Color"
          >
            <Palette className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {tab === 'text' ? (
          <div
            style={{ backgroundColor: BG_GRADIENTS[bgColorIndex] }}
            className="w-full max-w-md aspect-9/16 max-h-[75vh] rounded-3xl p-8 flex items-center justify-center text-center shadow-2xl transition-colors duration-300 relative"
          >
            <textarea
              placeholder="Type a status update..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              autoFocus
              maxLength={280}
              className="w-full bg-transparent text-white text-2xl md:text-3xl font-medium text-center placeholder:text-white/40 focus:outline-hidden resize-none overflow-hidden drop-shadow-md"
              rows={4}
            />
            <div className="absolute bottom-4 right-6 text-xs text-white/50 font-mono">
              {textContent.length}/280
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md flex flex-col items-center justify-center gap-4">
            {imageUrl ? (
              <div className="relative max-h-[65vh] rounded-3xl overflow-hidden shadow-2xl">
                <img src={imageUrl} alt="Uploaded" className="max-h-[65vh] object-contain rounded-3xl" />
                <button
                  onClick={() => setImageUrl('')}
                  className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-9/16 max-h-[65vh] rounded-3xl border-2 border-dashed border-gray-700 bg-gray-900/50 hover:bg-gray-900/80 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-emerald-400 transition cursor-pointer p-6"
              >
                <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="text-sm font-semibold">Upload Photo for Status</div>
                <p className="text-xs text-gray-500 text-center">Click to select image file from your device</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {imageUrl && (
              <input
                type="text"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-[#202c33] text-gray-100 px-4 py-3 rounded-2xl text-xs border border-gray-700 focus:border-emerald-500 focus:outline-hidden"
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom Send Action */}
      <div className="p-4 flex items-center justify-center z-20">
        <button
          onClick={handlePublish}
          disabled={tab === 'text' ? !textContent.trim() : !imageUrl}
          className="px-8 py-3 bg-[#00a884] hover:bg-[#06cf9c] disabled:opacity-40 text-gray-950 font-bold rounded-2xl text-sm flex items-center gap-2 shadow-xl transition cursor-pointer active:scale-95"
        >
          <Send className="w-4 h-4 fill-current" />
          <span>Post to Status (24h)</span>
        </button>
      </div>

    </div>
  );
};
