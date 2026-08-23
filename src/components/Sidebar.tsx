import React, { useState } from 'react';
import { 
  MessageSquare, CircleDashed, Users, Settings, 
  LogOut, Plus, Search, ShieldCheck, MoreVertical, Sparkles, Shield,
  Hash, Compass, UserCheck, Phone, UserPlus, ArrowRight, CheckCircle2
} from 'lucide-react';
import { Chat, StatusItem, UserProfile } from '../types';
import { ChatList } from './ChatList';

interface SidebarProps {
  currentUser: UserProfile;
  chats: Chat[];
  contacts?: UserProfile[];
  statuses: StatusItem[];
  activeChatId: string | null;
  typingUser: { chatId: string; userName: string } | null;
  onSelectChat: (chat: Chat) => void;
  onSelectContact?: (contact: UserProfile) => void;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenCreateRoom: () => void;
  onOpenExploreRooms: () => void;
  onOpenStatusViewer: () => void;
  onOpenStatusCreator: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  chats = [],
  contacts = [],
  statuses = [],
  activeChatId,
  typingUser,
  onSelectChat,
  onSelectContact,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenCreateRoom,
  onOpenExploreRooms,
  onOpenStatusViewer,
  onOpenStatusCreator,
  onOpenSettings,
  onLogout
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<'rooms' | 'direct' | 'explore'>('rooms');

  const safeChats = Array.isArray(chats) ? chats : [];
  const safeContacts = Array.isArray(contacts) ? contacts : [];
  const safeStatuses = Array.isArray(statuses) ? statuses : [];

  // Helper to normalize phone numbers (strip non-digits)
  const cleanDigits = (val: string) => val.replace(/\D/g, '');
  const searchDigits = cleanDigits(searchQuery);
  const isPhoneNumberSearch = searchDigits.length >= 3;

  // Filter contacts by phone number or name
  const matchingContactsByNumber = (activeNavTab === 'direct' && searchQuery.trim().length > 0)
    ? safeContacts.filter(c => {
        if (!c || c.id === currentUser.id) return false;
        const cDigits = cleanDigits(c.phone || '');
        const phoneMatch = cDigits.includes(searchDigits) || (c.phone && c.phone.toLowerCase().includes(searchQuery.toLowerCase()));
        const nameMatch = c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase());
        return phoneMatch || nameMatch;
      })
    : [];

  const filteredChats = safeChats.filter(c => {
    if (!c) return false;
    const chatName = c.name || '';
    
    // For direct chats, check if associated contact phone matches
    let phoneMatch = false;
    if (c.type === 'direct' && isPhoneNumberSearch) {
      const otherPartId = c.participants.find(p => p !== currentUser.id);
      const contactObj = safeContacts.find(con => con.id === otherPartId);
      if (contactObj?.phone) {
        phoneMatch = cleanDigits(contactObj.phone).includes(searchDigits);
      }
    }

    const matchesSearch = 
      chatName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phoneMatch ||
      (c.lastMessage && c.lastMessage.content && c.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.topic && c.topic.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeNavTab === 'rooms') {
      return matchesSearch && (c.type === 'room' || chatName.startsWith('#'));
    }
    if (activeNavTab === 'direct') {
      return matchesSearch && c.type === 'direct';
    }
    return matchesSearch;
  });

  const hasUnviewedStatus = safeStatuses.some(s =>
    s && s.viewers && !s.viewers.some(v => v.userId === currentUser.id) && s.userId !== currentUser.id
  );

  return (
    <div className="flex h-full w-full md:w-auto bg-white border-r border-[#e4e6eb] font-sans text-[#1c1e21] select-none z-20">
      
      {/* 1. LEFT NAVIGATION RAIL (Desktop) */}
      <aside className="hidden md:flex w-[64px] bg-white border-r border-[#e4e6eb] flex-col items-center py-5 space-y-5 shrink-0">
        
        {/* Brand App Icon: ChatRoom */}
        <div 
          onClick={onOpenExploreRooms}
          className="w-10 h-10 bg-gradient-to-tr from-[#0084ff] to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-blue-200/60 cursor-pointer hover:scale-105 transition-transform"
          title="ChatRoom • Real-Time E2EE"
        >
          <Hash className="w-5 h-5 stroke-[2.5]" />
        </div>

        {/* Nav Tabs */}
        <nav className="flex flex-col space-y-3">
          {/* Chat Rooms */}
          <button
            onClick={() => setActiveNavTab('rooms')}
            className={`p-2.5 rounded-xl transition cursor-pointer relative group ${
              activeNavTab === 'rooms'
                ? 'bg-blue-50 text-[#0084ff]'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Chat Rooms (#)"
          >
            <Hash className="h-5 w-5" />
            <span className="absolute left-14 bg-gray-900 text-white text-[11px] font-semibold py-1 px-2 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-30 shadow-lg">
              Rooms
            </span>
          </button>

          {/* Direct 1-on-1 Chats */}
          <button
            onClick={() => setActiveNavTab('direct')}
            className={`p-2.5 rounded-xl transition cursor-pointer relative group ${
              activeNavTab === 'direct'
                ? 'bg-blue-50 text-[#0084ff]'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Direct Messages"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="absolute left-14 bg-gray-900 text-white text-[11px] font-semibold py-1 px-2 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-30 shadow-lg">
              Direct Chats
            </span>
          </button>

          {/* Explore Public Rooms */}
          <button
            onClick={onOpenExploreRooms}
            className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer relative group"
            title="Explore Rooms"
          >
            <Compass className="h-5 w-5" />
            <span className="absolute left-14 bg-gray-900 text-white text-[11px] font-semibold py-1 px-2 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-30 shadow-lg">
              Explore Rooms
            </span>
          </button>

          {/* Create Room */}
          <button
            onClick={onOpenCreateRoom}
            className="p-2.5 rounded-xl text-gray-400 hover:text-[#0084ff] hover:bg-blue-50 transition cursor-pointer relative group"
            title="Create New Room"
          >
            <Plus className="h-5 w-5" />
            <span className="absolute left-14 bg-gray-900 text-white text-[11px] font-semibold py-1 px-2 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-30 shadow-lg">
              Create Room
            </span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer relative group"
            title="Settings & Security"
          >
            <Settings className="h-5 w-5" />
            <span className="absolute left-14 bg-gray-900 text-white text-[11px] font-semibold py-1 px-2 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-30 shadow-lg">
              Settings
            </span>
          </button>
        </nav>

        {/* Bottom User Avatar */}
        <div className="mt-auto pb-2">
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-xl bg-gray-200 border-2 border-white ring-1 ring-gray-200 overflow-hidden shadow-xs hover:ring-[#0084ff] transition cursor-pointer relative group"
            title={`${currentUser.name} (Settings)`}
          >
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
          </button>
        </div>
      </aside>

      {/* 2. CONVERSATION & ROOM LIST PANEL */}
      <div className="w-full md:w-[350px] bg-white flex flex-col h-full">
        
        {/* Header Section */}
        <div className="p-5 pb-3">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1c1e21]">
                {activeNavTab === 'rooms' ? 'Chat Rooms' : 'Direct Messages'}
              </h1>
              <p className="text-[11px] text-gray-400 font-medium">Real-time E2EE • Firestore DB</p>
            </div>
            
            <div className="flex items-center space-x-1.5">
              {/* Explore Rooms Button */}
              <button
                onClick={onOpenExploreRooms}
                className="p-2 text-gray-500 hover:text-[#0084ff] hover:bg-blue-50 rounded-full transition cursor-pointer"
                title="Explore Public Rooms"
              >
                <Compass className="h-4 w-4" />
              </button>

              {/* Compose New Chat / Room */}
              <button
                onClick={activeNavTab === 'rooms' ? onOpenCreateRoom : onOpenNewChat}
                className="p-2 bg-blue-50 text-[#0084ff] rounded-full hover:bg-blue-100 hover:shadow-xs transition cursor-pointer"
                title={activeNavTab === 'rooms' ? 'Create Chat Room' : 'New Direct Chat'}
              >
                <Plus className="h-4 w-4" />
              </button>

              {/* Overflow Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
                  title="Menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-11 z-40 bg-white border border-[#e4e6eb] rounded-2xl shadow-xl p-1.5 w-52 space-y-1 text-xs animate-scale-up text-[#1c1e21]">
                    <button
                      onClick={() => { onOpenCreateRoom(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#f0f2f5] rounded-xl transition text-left cursor-pointer font-medium"
                    >
                      <Hash className="w-4 h-4 text-[#0084ff]" />
                      <span>Create Chat Room</span>
                    </button>

                    <button
                      onClick={() => { onOpenExploreRooms(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#f0f2f5] rounded-xl transition text-left cursor-pointer font-medium"
                    >
                      <Compass className="w-4 h-4 text-emerald-600" />
                      <span>Explore Public Rooms</span>
                    </button>

                    <button
                      onClick={() => { onOpenNewChat(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#f0f2f5] rounded-xl transition text-left cursor-pointer font-medium"
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-500" />
                      <span>New Direct Chat</span>
                    </button>

                    <button
                      onClick={() => { onOpenNewGroup(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#f0f2f5] rounded-xl transition text-left cursor-pointer font-medium"
                    >
                      <Users className="w-4 h-4 text-amber-500" />
                      <span>New Group Chat</span>
                    </button>

                    <button
                      onClick={() => { onOpenSettings(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#f0f2f5] rounded-xl transition text-left cursor-pointer font-medium"
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span>Settings & Security</span>
                    </button>

                    <div className="border-t border-[#e4e6eb] my-1" />

                    <button
                      onClick={() => { onLogout(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 text-red-600 rounded-xl transition text-left cursor-pointer font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Tab Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#f0f2f5] rounded-xl mb-3">
            <button
              onClick={() => setActiveNavTab('rooms')}
              className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeNavTab === 'rooms'
                  ? 'bg-white text-[#0084ff] shadow-xs'
                  : 'text-gray-500 hover:text-[#1c1e21]'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Rooms</span>
            </button>
            <button
              onClick={() => setActiveNavTab('direct')}
              className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeNavTab === 'direct'
                  ? 'bg-white text-[#0084ff] shadow-xs'
                  : 'text-gray-500 hover:text-[#1c1e21]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Direct</span>
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={activeNavTab === 'rooms' ? 'Search rooms by #name or topic...' : 'Search by name or phone number (+1 555...)'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f0f2f5] text-[#1c1e21] border-none rounded-2xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#0084ff]/30 transition placeholder-gray-400 font-medium"
            />
          </div>
        </div>

        {/* WhatsApp-style Number / Contact Search Quick Results when searching in Direct tab */}
        {activeNavTab === 'direct' && searchQuery.trim().length > 0 && (
          <div className="px-3 pb-2 border-b border-[#e4e6eb] bg-blue-50/40">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider px-2 py-1 flex items-center justify-between">
              <span>Contacts by number</span>
              {isPhoneNumberSearch && (
                <span className="text-[#0084ff] font-semibold lowercase">number lookup</span>
              )}
            </div>

            {matchingContactsByNumber.length > 0 ? (
              <div className="space-y-1 mt-1 max-h-40 overflow-y-auto">
                {matchingContactsByNumber.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => {
                      if (onSelectContact) {
                        onSelectContact(contact);
                        setSearchQuery('');
                      }
                    }}
                    className="w-full p-2 rounded-xl bg-white hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition flex items-center justify-between text-left cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0 overflow-hidden">
                        {contact.avatar ? (
                          <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                        ) : (
                          contact.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1c1e21] truncate group-hover:text-[#0084ff]">
                          {contact.name}
                        </p>
                        <p className="text-[11px] font-mono text-gray-500 truncate flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-gray-400 inline" />
                          <span>{contact.phone}</span>
                        </p>
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-blue-50 text-[#0084ff] rounded-lg text-[10px] font-bold group-hover:bg-[#0084ff] group-hover:text-white transition flex items-center gap-1 shrink-0 ml-2">
                      <span>Chat</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-gray-200/80 mt-1 text-center">
                <p className="text-xs font-semibold text-gray-700">No registered user found</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Chats can only be opened with existing users on CipherChat.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Chat List Scroll View */}
        <ChatList
          chats={filteredChats}
          activeChatId={activeChatId}
          typingUser={typingUser}
          onSelectChat={onSelectChat}
        />

        {/* Trust Footer */}
        <div className="p-3 bg-[#fafafa] border-t border-[#e4e6eb] flex items-center justify-between text-[11px] text-gray-500 px-4">
          <div className="flex items-center gap-1.5 text-green-600 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero-Knowledge E2EE</span>
          </div>
          <span className="font-mono text-[10px] text-gray-400">Firestore Sync</span>
        </div>

      </div>

    </div>
  );
};
