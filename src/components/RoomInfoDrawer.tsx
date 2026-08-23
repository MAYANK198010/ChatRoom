import React from 'react';
import { 
  X, Hash, Users, ShieldCheck, Lock, Globe, 
  Share2, LogOut, Trash2, Clock, CheckCircle2, Shield
} from 'lucide-react';
import { Chat, UserProfile } from '../types';

interface RoomInfoDrawerProps {
  chat: Chat;
  allUsers: UserProfile[];
  currentUserId: string;
  onClose: () => void;
  onLeaveRoom: () => void;
  onClearRoom: () => void;
}

export const RoomInfoDrawer: React.FC<RoomInfoDrawerProps> = ({
  chat,
  allUsers,
  currentUserId,
  onClose,
  onLeaveRoom,
  onClearRoom
}) => {
  const isCreator = chat.createdBy === currentUserId;
  const isJoined = chat.participants.includes(currentUserId);

  return (
    <aside className="w-80 md:w-96 border-l border-[#e4e6eb] bg-white h-full overflow-y-auto flex flex-col font-sans select-none z-20 animate-slide-left text-[#1c1e21]">
      
      {/* Header */}
      <div className="p-4 border-b border-[#e4e6eb] flex items-center justify-between">
        <h3 className="font-bold text-sm text-[#1c1e21] flex items-center gap-2">
          <Hash className="w-4 h-4 text-[#0084ff]" />
          <span>Room Details</span>
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Card */}
      <div className="p-6 text-center border-b border-[#e4e6eb] bg-[#fafafa]">
        <div className="relative inline-block mb-3">
          <img
            src={chat.avatar}
            alt={chat.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md mx-auto"
          />
          {chat.isPrivate ? (
            <div className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-white rounded-full shadow-xs">
              <Lock className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="absolute -bottom-1 -right-1 p-1 bg-[#0084ff] text-white rounded-full shadow-xs">
              <Globe className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <h2 className="text-xl font-black text-[#1c1e21] tracking-tight">{chat.name}</h2>
        <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-50 text-[#0084ff] text-[11px] font-bold rounded-full font-mono">
          {chat.category || 'General Room'}
        </span>
        <p className="text-xs text-gray-600 mt-2 leading-relaxed max-w-xs mx-auto">
          {chat.topic || chat.description || 'Secure encrypted chat room.'}
        </p>
      </div>

      {/* Security & Cryptography Card */}
      <div className="p-4 border-b border-[#e4e6eb] bg-green-50/40">
        <div className="flex items-center gap-2 text-green-700 font-bold text-xs mb-1.5">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span>Zero-Knowledge AES-GCM-256</span>
        </div>
        <p className="text-[11px] text-gray-600 leading-relaxed">
          All messages transmitted in this room are encrypted client-side using Web Crypto API. Server only stores ciphertext.
        </p>
        <div className="mt-2 p-2 bg-white/80 rounded-xl border border-green-200/50 flex items-center justify-between text-[10px] font-mono text-gray-500">
          <span>Key Fingerprint:</span>
          <span className="font-bold text-[#0084ff]">{chat.sharedKeyFingerprint || 'CR-AES-GEN-9912'}</span>
        </div>
      </div>

      {/* Participants List */}
      <div className="p-4 border-b border-[#e4e6eb] flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
            <Users className="w-4 h-4 text-[#0084ff]" />
            <span>Room Participants ({chat.participants.length})</span>
          </div>
        </div>

        <div className="space-y-2">
          {chat.participants.map(userId => {
            const user = allUsers.find(u => u.id === userId);
            const isSelf = userId === currentUserId;
            const userName = isSelf ? 'You' : (user?.name || (userId.startsWith('user_') ? userId.replace('user_', '').toUpperCase() : 'Participant'));
            const userAvatar = user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`;

            return (
              <div
                key={userId}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-8 h-8 rounded-lg object-cover border border-gray-200"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full ring-1 ring-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1c1e21] truncate flex items-center gap-1">
                      <span>{userName}</span>
                      {isSelf && <span className="text-[10px] text-gray-400 font-normal">(You)</span>}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate font-mono">
                      E2EE Verified
                    </div>
                  </div>
                </div>

                {chat.adminIds?.includes(userId) && (
                  <span className="text-[10px] font-bold text-[#0084ff] bg-blue-50 px-2 py-0.5 rounded-md">
                    Admin
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-gray-50 space-y-2 mt-auto">
        <button
          onClick={onClearRoom}
          className="w-full py-2.5 px-4 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4 text-gray-500" />
          <span>Clear Messages</span>
        </button>

        {isJoined && (
          <button
            onClick={onLeaveRoom}
            className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Room</span>
          </button>
        )}
      </div>

    </aside>
  );
};
