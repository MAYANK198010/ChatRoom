import React, { useState } from 'react';
import { 
  X, Users, ShieldCheck, Lock, Clock, Bell, BellOff, 
  Trash2, UserPlus, LogOut, ChevronRight, Crown 
} from 'lucide-react';
import { Chat, Message, UserProfile } from '../types';

interface GroupInfoDrawerProps {
  chat: Chat;
  allContacts: UserProfile[];
  currentUserId: string;
  onClose: () => void;
  onAddMember: (userId: string) => void;
  onRemoveMember: (userId: string) => void;
  onToggleAdmin: (userId: string) => void;
  onLeaveGroup: () => void;
  onClearChat: () => void;
  onUpdateDisappearingTimer: (seconds: number) => void;
}

export const GroupInfoDrawer: React.FC<GroupInfoDrawerProps> = ({
  chat,
  allContacts = [],
  currentUserId,
  onClose,
  onAddMember,
  onRemoveMember,
  onToggleAdmin,
  onLeaveGroup,
  onClearChat,
  onUpdateDisappearingTimer
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDisappearing, setShowDisappearing] = useState(false);

  const safeContacts = Array.isArray(allContacts) ? allContacts : [];
  const participants = Array.isArray(chat?.participants) ? chat.participants : [];

  const participantsList = safeContacts.filter(c => c && participants.includes(c.id));
  const nonMembers = safeContacts.filter(c => c && !participants.includes(c.id) && c.id !== currentUserId);

  const isCurrentUserAdmin = chat?.adminIds?.includes(currentUserId) || chat?.adminIds?.includes('current_user');

  return (
    <div className="w-full md:w-88 md:min-w-[320px] bg-white border-l border-[#e4e6eb] flex flex-col h-full overflow-y-auto animate-slide-left select-none text-[#1c1e21] font-sans">
      
      {/* Header */}
      <div className="p-5 flex items-center justify-between border-b border-[#e4e6eb] bg-white">
        <h3 className="font-bold text-base">Group Info</h3>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        
        {/* Group Profile Card */}
        <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-3xl border border-gray-100">
          <img
            src={chat.avatar}
            alt={chat.name}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md mb-3"
          />
          <h2 className="text-lg font-bold text-[#1c1e21]">{chat.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">Group • {chat.participants.length} members</p>
        </div>

        {/* Group Description */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Description</div>
          <p className="text-xs text-[#1c1e21] leading-relaxed">
            {chat.about || 'Discussion group with multi-party end-to-end encrypted messaging.'}
          </p>
        </div>

        {/* Encryption badge */}
        <div className="bg-green-50 p-4 rounded-2xl border border-green-200/60 flex items-center gap-3">
          <div className="p-2 bg-white text-green-600 rounded-xl shadow-2xs">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-green-800">End-to-End Encryption</div>
            <div className="text-[11px] text-green-700">Multi-party AES-256 session active.</div>
          </div>
        </div>

        {/* Participants list */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#1c1e21]">{chat.participants.length} Participants</span>
            {isCurrentUserAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="text-[#0084ff] hover:text-[#0073e6] flex items-center gap-1 cursor-pointer font-bold"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-200 space-y-1">
            {/* Current user */}
            <div className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0084ff] flex items-center justify-center text-xs font-bold">
                  You
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1c1e21]">You</div>
                  <div className="text-[10px] text-gray-500">Active session</div>
                </div>
              </div>
              {isCurrentUserAdmin && (
                <span className="px-2 py-0.5 bg-blue-50 text-[#0084ff] border border-blue-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" /> Admin
                </span>
              )}
            </div>

            {/* Other participants */}
            {participantsList.map((p) => {
              const isAdmin = chat.adminIds?.includes(p.id);
              return (
                <div key={p.id} className="py-2 flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-xl object-cover border border-gray-200" />
                    <div>
                      <div className="text-xs font-bold text-[#1c1e21]">{p.name}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[130px]">{p.about}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <span className="px-2 py-0.5 bg-blue-50 text-[#0084ff] border border-blue-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5" /> Admin
                      </span>
                    )}

                    {isCurrentUserAdmin && (
                      <button
                        onClick={() => onRemoveMember(p.id)}
                        className="text-gray-400 hover:text-red-600 text-xs px-1"
                        title="Remove member"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onLeaveGroup}
            className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl text-xs transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Group</span>
          </button>

          <button
            onClick={onClearChat}
            className="w-full flex items-center justify-center gap-2 p-3 text-gray-500 hover:text-red-600 hover:bg-gray-100 font-semibold rounded-2xl text-xs transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Group Messages</span>
          </button>
        </div>

      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#e4e6eb] rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm">Add New Member</h4>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {nonMembers.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4">All contacts are already in this group</div>
              ) : (
                nonMembers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { onAddMember(c.id); setShowAddModal(false); }}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition text-left cursor-pointer"
                  >
                    <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-xl object-cover" />
                    <div>
                      <div className="text-xs font-bold">{c.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{c.phone}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
