import React, { useEffect, useMemo, useState } from 'react';
import { Search, Users, X, Shield, Loader2, UserPlus } from 'lucide-react';
import { UserProfile } from '../types';
import { storage } from '../services/storage';
import { searchUsers } from '../services/userDirectory';

interface NewChatModalProps {
  contacts: UserProfile[];
  onSelectContact?: (contact: UserProfile) => void;
  // Backward-compatible prop used by the current App implementation.
  onStartChat?: (chat: any) => void;
  onNewGroupClick: () => void;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  contacts = [],
  onSelectContact,
  onStartChat,
  onNewGroupClick,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [remoteUsers, setRemoteUsers] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const safeContacts = Array.isArray(contacts) ? contacts : [];

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchError('');
      setIsSearching(true);
      try {
        const results = await searchUsers(search, storage.getCurrentUser()?.id);
        if (!cancelled) setRemoteUsers(results);
      } catch (error) {
        console.warn('User directory search failed:', error);
        if (!cancelled) {
          setRemoteUsers([]);
          setSearchError('Could not search the online user directory.');
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, search.trim() ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search]);

  const users = useMemo(() => {
    const merged = new Map<string, UserProfile>();
    safeContacts.forEach((user) => merged.set(user.id, user));
    remoteUsers.forEach((user) => merged.set(user.id, user));
    const normalized = search.trim().toLowerCase();
    return Array.from(merged.values()).filter((user) => {
      if (!normalized) return true;
      return [user.name, user.phone, user.email, user.about]
        .some((value) => String(value || '').toLowerCase().includes(normalized));
    });
  }, [safeContacts, remoteUsers, search]);

  const selectUser = (contact: UserProfile) => {
    if (onSelectContact) {
      onSelectContact(contact);
      onClose();
      return;
    }

    // Compatibility with App.tsx's existing onStartChat callback.
    const currentUser = storage.getCurrentUser();
    if (!currentUser) return;

    const chat = {
      id: 'chat_' + contact.id,
      type: 'direct',
      name: contact.name,
      avatar: contact.avatar,
      about: contact.about,
      participants: [currentUser.id, contact.id],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      disappearingTimer: 0,
      createdAt: Date.now(),
      sharedKeyFingerprint: 'CR-AES-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    };
    onStartChat?.(chat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none text-[#1c1e21] font-sans">
      <div className="bg-white border border-[#e4e6eb] rounded-3xl overflow-hidden w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-[#e4e6eb] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg tracking-tight">New Conversation</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Search registered ChatRoom users</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 border-b border-[#e4e6eb] bg-[#fafafa]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-white text-[#1c1e21] pl-10 pr-10 py-2.5 rounded-xl text-xs border border-gray-200 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition placeholder-gray-400"
            />
            {isSearching && <Loader2 className="w-4 h-4 text-[#0084ff] animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />}
          </div>
          {searchError && <p className="text-[10px] text-red-500 mt-2 px-1">{searchError}</p>}
        </div>

        <div className="p-3 border-b border-[#e4e6eb] bg-white">
          <button
            onClick={() => { onClose(); onNewGroupClick(); }}
            className="w-full flex items-center gap-3 p-2.5 hover:bg-[#f0f2f5] rounded-2xl transition text-left cursor-pointer group"
          >
            <div className="p-2.5 bg-blue-50 text-[#0084ff] rounded-xl group-hover:bg-[#0084ff] group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1c1e21]">Create Group</div>
              <div className="text-[10px] text-gray-500">Start a multi-user conversation</div>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1 flex items-center justify-between">
            <span>{search.trim() ? 'Search Results' : 'Registered Users'} ({users.length})</span>
            <span className="text-emerald-600 font-semibold lowercase">Firestore</span>
          </div>

          {users.length > 0 ? users.map((user) => (
            <button
              key={user.id}
              onClick={() => selectUser(user)}
              className="w-full flex items-center justify-between p-2.5 hover:bg-[#f0f2f5] rounded-2xl transition text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover border border-[#e4e6eb]" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#1c1e21] group-hover:text-[#0084ff] truncate">{user.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">{user.email || user.phone || user.about}</div>
                </div>
              </div>
              <span className="shrink-0 ml-2 text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1">
                <UserPlus className="w-3 h-3" /> Chat
              </span>
            </button>
          )) : (
            <div className="p-8 text-center text-gray-500">
              <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">{search.trim() ? 'No user found' : 'No registered users yet'}</p>
              <p className="text-[11px] text-gray-400 mt-1">Users appear here after their profile is saved to Firestore.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
