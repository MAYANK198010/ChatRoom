import React, { useState } from 'react';
import { Hash, X, Plus, Shield, Globe, Lock, Sparkles, Check } from 'lucide-react';
import { Chat } from '../types';

interface CreateRoomModalProps {
  currentUserId: string;
  currentUserName: string;
  onCreateRoom: (room: Partial<Chat>) => void;
  onClose: () => void;
}

const CATEGORIES = [
  'Community',
  'Technology',
  'AI & Data',
  'Crypto & Privacy',
  'Design & Creative',
  'Gaming',
  'Hangout'
];

const PRESET_ROOM_AVATARS = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&auto=format&fit=crop&q=80'
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  currentUserId,
  currentUserName,
  onCreateRoom,
  onClose
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [avatar, setAvatar] = useState(PRESET_ROOM_AVATARS[0]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a room name');
      return;
    }

    let formattedName = name.trim();
    if (!formattedName.startsWith('#')) {
      formattedName = '#' + formattedName;
    }

    const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    onCreateRoom({
      id: roomId,
      name: formattedName,
      description: description.trim() || 'Encrypted chat room',
      topic: description.trim() || 'Open encrypted discussion',
      category,
      avatar,
      type: 'room',
      createdBy: currentUserId,
      createdByName: currentUserName,
      participants: [currentUserId],
      adminIds: [currentUserId],
      isPrivate,
      passcode: isPrivate ? passcode.trim() : undefined,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      disappearingTimer: 0,
      createdAt: Date.now(),
      sharedKeyFingerprint: 'CR-AES-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans text-[#1c1e21] animate-fade-in">
      <div className="bg-white border border-[#e4e6eb] rounded-3xl overflow-hidden w-full max-w-md shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-[#e4e6eb] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 text-[#0084ff] rounded-xl flex items-center justify-center font-bold">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Create Chat Room</h3>
              <p className="text-[11px] text-gray-500">Zero-knowledge AES-256 E2EE enabled</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Room Name */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Room Name
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400">#</span>
              <input
                type="text"
                placeholder="tech-discussions"
                value={name.replace(/^#/, '')}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                autoFocus
                className="w-full bg-gray-50 text-[#1c1e21] pl-8 pr-4 py-2.5 rounded-xl text-sm border border-gray-200 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition font-medium"
              />
            </div>
          </div>

          {/* Topic / Description */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Topic / Purpose
            </label>
            <textarea
              placeholder="What is this room about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-gray-50 text-[#1c1e21] px-3.5 py-2 rounded-xl text-xs border border-gray-200 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition resize-none"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    category === cat
                      ? 'bg-[#0084ff] text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Presets */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Room Avatar
            </label>
            <div className="flex gap-2 items-center">
              {PRESET_ROOM_AVATARS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatar(p)}
                  className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                    avatar === p ? 'border-[#0084ff] scale-110 shadow-xs' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={p} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Switch */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPrivate ? <Lock className="w-4 h-4 text-indigo-500" /> : <Globe className="w-4 h-4 text-[#0084ff]" />}
              <div>
                <div className="text-xs font-bold text-[#1c1e21]">{isPrivate ? 'Private Room' : 'Public Room'}</div>
                <div className="text-[10px] text-gray-500">{isPrivate ? 'Requires passcode or invite to join' : 'Visible in Room Explorer for anyone to join'}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                isPrivate ? 'bg-[#0084ff]' : 'bg-gray-200'
              }`}
            >
              <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                isPrivate ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          {isPrivate && (
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Room Passcode (Optional)
              </label>
              <input
                type="text"
                placeholder="Enter access code..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-gray-50 text-[#1c1e21] px-3 py-2 rounded-xl text-xs border border-gray-200 focus:border-[#0084ff] focus:outline-none transition font-mono"
              />
            </div>
          )}

          {/* Submit */}
          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="w-full px-6 py-2.5 bg-[#0084ff] hover:bg-[#0073e6] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-100 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Chat Room</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
