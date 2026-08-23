import React, { useState } from 'react';
import { Users, X, Check, Camera, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserProfile, Chat } from '../types';

interface NewGroupModalProps {
  contacts: UserProfile[];
  currentUserId: string;
  onCreateGroup: (newChat: Chat) => void;
  onClose: () => void;
}

const PRESET_GROUP_ICONS = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=150&auto=format&fit=crop&q=80'
];

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  contacts = [],
  currentUserId,
  onCreateGroup,
  onClose
}) => {
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [avatar, setAvatar] = useState(PRESET_GROUP_ICONS[0]);

  const safeContacts = Array.isArray(contacts) ? contacts : [];

  const toggleSelect = (id: string) => {
    if (selectedContactIds.includes(id)) {
      setSelectedContactIds((selectedContactIds || []).filter(i => i !== id));
    } else {
      setSelectedContactIds([...(selectedContactIds || []), id]);
    }
  };

  const handleCreate = () => {
    if (!groupName.trim()) return;

    const newChat: Chat = {
      id: 'chat_grp_' + Date.now(),
      type: 'group',
      name: groupName.trim(),
      avatar: avatar,
      about: groupDesc.trim() || 'Encrypted group chat',
      participants: [currentUserId, ...selectedContactIds],
      adminIds: [currentUserId],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      disappearingTimer: 0,
      createdAt: Date.now(),
      sharedKeyFingerprint: 'GRP-AES-' + Math.random().toString(36).substr(2, 6).toUpperCase()
    };

    onCreateGroup(newChat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none text-[#1c1e21] font-sans">
      <div className="bg-white border border-[#e4e6eb] rounded-3xl overflow-hidden w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#e4e6eb] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 text-[#0084ff] rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-lg tracking-tight">
              {step === 'select' ? 'Add Group Members' : 'New Group Details'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Select Participants */}
        {step === 'select' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            
            {/* Selected Chips */}
            {selectedContactIds.length > 0 && (
              <div className="p-3 border-b border-[#e4e6eb] flex items-center gap-2 overflow-x-auto bg-[#fafafa]">
                {selectedContactIds.map(id => {
                  const c = contacts.find(contact => contact.id === id);
                  if (!c) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-xs text-[#1c1e21] border border-gray-200 shadow-2xs shrink-0"
                    >
                      <img src={c.avatar} alt={c.name} className="w-4 h-4 rounded-full object-cover" />
                      <span className="font-medium">{c.name}</span>
                      <button onClick={() => toggleSelect(id)} className="text-gray-400 hover:text-red-500 cursor-pointer">✕</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List of Contacts */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {contacts.map((c) => {
                const isSelected = selectedContactIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleSelect(c.id)}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-[#f0f2f5] rounded-2xl transition text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-xl object-cover border border-[#e4e6eb]" />
                      <div>
                        <div className="text-xs font-bold text-[#1c1e21] group-hover:text-[#0084ff]">{c.name}</div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[200px]">{c.about}</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                      isSelected ? 'bg-[#0084ff] border-[#0084ff] text-white' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <div className="p-4 bg-[#fafafa] border-t border-[#e4e6eb] flex justify-end">
              <button
                disabled={selectedContactIds.length === 0}
                onClick={() => setStep('details')}
                className="px-5 py-2.5 bg-[#0084ff] hover:bg-[#0073e6] disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-100 transition cursor-pointer"
              >
                <span>Next ({selectedContactIds.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* STEP 2: Group Details */}
        {step === 'details' && (
          <div className="p-6 space-y-4">
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={avatar}
                  alt="Group"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-gray-100"
                />
              </div>

              <div className="flex-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Group Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Product Launch Team"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-[#0084ff]/30 focus:border-[#0084ff] focus:outline-none transition"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Group Description
              </label>
              <textarea
                rows={2}
                placeholder="Topic, rules, or goal..."
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-[#0084ff]/30 focus:border-[#0084ff] focus:outline-none transition resize-none"
              />
            </div>

            {/* Select Preset Icons */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Choose Group Icon
              </label>
              <div className="flex gap-2">
                {PRESET_GROUP_ICONS.map((icon, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(icon)}
                    className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition ${
                      avatar === icon ? 'border-[#0084ff] scale-105 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={icon} alt="icon" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-2.5 text-xs text-green-800">
              <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
              <span>Multi-party AES-256 session keys are auto-derived for all members.</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep('select')}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-[#1c1e21]"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={!groupName.trim()}
                className="px-5 py-2.5 bg-[#0084ff] hover:bg-[#0073e6] disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-100 transition cursor-pointer"
              >
                Create Group ({selectedContactIds.length + 1} members)
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
