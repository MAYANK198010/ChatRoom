import React, { useState } from 'react';
import { 
  X, Phone, Video, Lock, Bell, BellOff, Clock, Star, 
  Trash2, ShieldAlert, Image, FileText, Link2, ChevronRight, CheckCircle2, ShieldCheck 
} from 'lucide-react';
import { Chat, Message, UserProfile } from '../types';

interface ContactInfoDrawerProps {
  chat: Chat;
  contact?: UserProfile;
  messages: Message[];
  onClose: () => void;
  onVerifySecurityCode: () => void;
  onUpdateDisappearingTimer: (seconds: number) => void;
  onToggleMute: () => void;
  onClearChat: () => void;
  onBlockUser: () => void;
  isBlocked: boolean;
}

export const ContactInfoDrawer: React.FC<ContactInfoDrawerProps> = ({
  chat,
  contact,
  messages = [],
  onClose,
  onVerifySecurityCode,
  onUpdateDisappearingTimer,
  onToggleMute,
  onClearChat,
  onBlockUser,
  isBlocked
}) => {
  const [showDisappearingOptions, setShowDisappearingOptions] = useState(false);

  const safeMessages = Array.isArray(messages) ? messages : [];
  const mediaMessages = safeMessages.filter(m => m && m.type === 'image' && m.mediaUrl);
  const docMessages = safeMessages.filter(m => m && m.type === 'document');

  const timerLabel = {
    0: 'Off',
    86400: '24 hours',
    604800: '7 days',
    7776000: '90 days'
  }[chat.disappearingTimer] || 'Off';

  return (
    <div className="w-full md:w-88 md:min-w-[320px] bg-white border-l border-[#e4e6eb] flex flex-col h-full overflow-y-auto animate-slide-left select-none text-[#1c1e21] font-sans">
      
      {/* Header */}
      <div className="p-5 flex items-center justify-between border-b border-[#e4e6eb] bg-white">
        <h3 className="font-bold text-base">Contact Info</h3>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-3xl border border-gray-100">
          <img
            src={chat.avatar}
            alt={chat.name}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md mb-3"
          />
          <h2 className="text-lg font-bold text-[#1c1e21]">{chat.name}</h2>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{contact?.phone || '+1 555-0192'}</p>
        </div>

        {/* About Bio */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">About</div>
          <p className="text-xs text-[#1c1e21] leading-relaxed">
            {contact?.about || chat.about || 'Available'}
          </p>
        </div>

        {/* Media Shared */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#1c1e21]">Media & Docs</span>
            <span className="text-[#0084ff] font-mono">{mediaMessages.length + docMessages.length}</span>
          </div>

          {mediaMessages.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {mediaMessages.slice(0, 6).map((m, idx) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-gray-200 border border-gray-200">
                  <img src={m.mediaUrl} alt="media" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-gray-400 text-center py-2">No media shared yet</div>
          )}
        </div>

        {/* Security & Verification Card */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
          <button
            onClick={onVerifySecurityCode}
            className="w-full flex items-center justify-between text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1c1e21] group-hover:text-[#0084ff]">
                  Encryption
                </div>
                <div className="text-[11px] text-gray-500">
                  End-to-end encrypted. Tap to verify.
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700" />
          </button>
        </div>

        {/* Disappearing Messages Settings */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
          <div
            onClick={() => setShowDisappearingOptions(!showDisappearingOptions)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-[#0084ff] rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1c1e21] group-hover:text-[#0084ff]">
                  Disappearing Messages
                </div>
                <div className="text-[11px] text-[#0084ff] font-semibold">{timerLabel}</div>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showDisappearingOptions ? 'rotate-90' : ''}`} />
          </div>

          {showDisappearingOptions && (
            <div className="pt-2 grid grid-cols-2 gap-2 border-t border-gray-200 mt-2">
              {[
                { sec: 0, label: 'Off' },
                { sec: 86400, label: '24 Hours' },
                { sec: 604800, label: '7 Days' },
                { sec: 7776000, label: '90 Days' }
              ].map(opt => (
                <button
                  key={opt.sec}
                  onClick={() => {
                    onUpdateDisappearingTimer(opt.sec);
                    setShowDisappearingOptions(false);
                  }}
                  className={`p-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    chat.disappearingTimer === opt.sec
                      ? 'bg-blue-50 border-[#0084ff] text-[#0084ff]'
                      : 'border-gray-200 hover:bg-white text-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications & Actions */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
          <button
            onClick={onToggleMute}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 hover:text-[#1c1e21] cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              {chat.isMuted ? <BellOff className="w-4 h-4 text-amber-500" /> : <Bell className="w-4 h-4 text-gray-500" />}
              <span>Mute notifications</span>
            </div>
            <span className="text-[11px] font-bold text-[#0084ff]">{chat.isMuted ? 'Muted' : 'Active'}</span>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onBlockUser}
            className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl text-xs transition cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isBlocked ? 'Unblock Contact' : 'Block Contact'}</span>
          </button>

          <button
            onClick={onClearChat}
            className="w-full flex items-center justify-center gap-2 p-3 text-gray-500 hover:text-red-600 hover:bg-gray-100 font-semibold rounded-2xl text-xs transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Chat History</span>
          </button>
        </div>

      </div>
    </div>
  );
};
