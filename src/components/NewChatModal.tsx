import React, { useState } from 'react';
import { Search, UserPlus, Users, X, Phone, Lock, Shield } from 'lucide-react';
import { UserProfile } from '../types';

interface NewChatModalProps {
  contacts: UserProfile[];
  onSelectContact: (contact: UserProfile) => void;
  onNewGroupClick: () => void;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  contacts = [],
  onSelectContact,
  onNewGroupClick,
  onClose
}) => {
  const [search, setSearch] = useState('');

  const safeContacts = Array.isArray(contacts) ? contacts : [];

  const filtered = safeContacts.filter(c =>
    c && (
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search)) ||
      (c.about && c.about.toLowerCase().includes(search.toLowerCase()))
    )
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none text-[#1c1e21] font-sans">
      <div className="bg-white border border-[#e4e6eb] rounded-3xl overflow-hidden w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#e4e6eb] flex items-center justify-between">
          <h3 className="font-bold text-lg tracking-tight">New Conversation</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3.5 border-b border-[#e4e6eb] bg-[#fafafa]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search existing contacts by name or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-white text-[#1c1e21] pl-10 pr-4 py-2 rounded-xl text-xs border border-gray-200 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition placeholder-gray-400"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-b border-[#e4e6eb] space-y-1.5 bg-white">
          <button
            onClick={() => { onClose(); onNewGroupClick(); }}
            className="w-full flex items-center gap-3 p-2.5 hover:bg-[#f0f2f5] rounded-2xl transition text-left cursor-pointer group"
          >
            <div className="p-2.5 bg-blue-50 text-[#0084ff] rounded-xl group-hover:bg-[#0084ff] group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1c1e21]">Create Group</div>
              <div className="text-[10px] text-gray-500">End-to-end encrypted multi-user group</div>
            </div>
          </button>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1 flex items-center justify-between">
            <span>Registered Contacts ({filtered.length})</span>
            <span className="text-emerald-600 font-semibold lowercase">verified only</span>
          </div>

          {filtered.length > 0 ? (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => { onSelectContact(c); onClose(); }}
                className="w-full flex items-center justify-between p-2.5 hover:bg-[#f0f2f5] rounded-2xl transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-10 h-10 rounded-xl object-cover border border-[#e4e6eb]"
                  />
                  <div>
                    <div className="text-xs font-bold text-[#1c1e21] group-hover:text-[#0084ff]">
                      {c.name}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">{c.phone}</div>
                  </div>
                </div>
                <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  E2EE
                </span>
              </button>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">No registered contact found</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Chats can only be initiated with existing verified users.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
