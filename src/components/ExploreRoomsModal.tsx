import React, { useState } from 'react';
import { 
  Compass, X, Search, Hash, Users, Lock, 
  Globe, Plus, ArrowRight, ShieldCheck, Check 
} from 'lucide-react';
import { Chat } from '../types';

interface ExploreRoomsModalProps {
  rooms: Chat[];
  currentUserId: string;
  onJoinRoom: (room: Chat) => void;
  onOpenCreateRoom: () => void;
  onClose: () => void;
}

const CATEGORIES = [
  'All',
  'Community',
  'Technology',
  'AI & Data',
  'Crypto & Privacy',
  'Design & Creative',
  'Gaming',
  'Social'
];

export const ExploreRoomsModal: React.FC<ExploreRoomsModalProps> = ({
  rooms = [],
  currentUserId,
  onJoinRoom,
  onOpenCreateRoom,
  onClose
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  const safeRooms = Array.isArray(rooms) ? rooms : [];

  const filtered = safeRooms.filter(r => {
    if (!r) return false;
    const matchesSearch = 
      (r.name && r.name.toLowerCase().includes(search.toLowerCase())) ||
      (r.topic && r.topic.toLowerCase().includes(search.toLowerCase())) ||
      (r.category && r.category.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = selectedCat === 'All' || (r.category && r.category.toLowerCase() === selectedCat.toLowerCase());
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans text-[#1c1e21] animate-fade-in">
      <div className="bg-white border border-[#e4e6eb] rounded-3xl overflow-hidden w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#e4e6eb] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-50 text-[#0084ff] rounded-xl flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Explore Chat Rooms</h3>
              <p className="text-[11px] text-gray-500">Discover and join real-time encrypted community rooms</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onClose(); onOpenCreateRoom(); }}
              className="px-3.5 py-1.5 bg-[#0084ff] hover:bg-[#0073e6] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Room</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Categories Bar */}
        <div className="p-4 border-b border-[#e4e6eb] bg-[#fafafa] space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chat rooms by name, topic, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-[#1c1e21] pl-10 pr-4 py-2 rounded-xl text-xs border border-gray-200 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition font-medium"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCat === cat
                    ? 'bg-[#1c1e21] text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-600 hover:text-[#1c1e21] hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-gray-400 text-xs space-y-2">
              <Compass className="w-8 h-8 mx-auto text-gray-300" />
              <p className="font-semibold text-gray-500">No chat rooms found</p>
              <p className="text-[11px] text-gray-400">Be the first to create a room for this category!</p>
            </div>
          ) : (
            filtered.map(room => {
              const isJoined = room.participants.includes(currentUserId);
              return (
                <div
                  key={room.id}
                  className="bg-white border border-[#e4e6eb] hover:border-blue-300 hover:shadow-md transition-all rounded-2xl p-4 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Avatar + Title + Status */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={room.avatar}
                          alt={room.name}
                          className="w-10 h-10 rounded-xl object-cover border border-[#e4e6eb]"
                        />
                        <div>
                          <h4 className="font-bold text-sm text-[#1c1e21] group-hover:text-[#0084ff] transition flex items-center gap-1">
                            <span>{room.name}</span>
                            {room.isPrivate && <Lock className="w-3 h-3 text-gray-400" />}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {room.category || 'General'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-500 font-semibold bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        <Users className="w-3 h-3 text-[#0084ff]" />
                        <span>{room.participants.length}</span>
                      </div>
                    </div>

                    {/* Room Topic */}
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-3">
                      {room.topic || room.about || room.description || 'End-to-End encrypted chat room.'}
                    </p>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-green-700 font-mono">
                      <ShieldCheck className="w-3 h-3 text-green-600" />
                      <span>AES-256</span>
                    </div>

                    <button
                      onClick={() => {
                        onJoinRoom(room);
                        onClose();
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        isJoined
                          ? 'bg-blue-50 text-[#0084ff] hover:bg-blue-100'
                          : 'bg-[#0084ff] text-white hover:bg-[#0073e6] shadow-xs'
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Open Room</span>
                        </>
                      ) : (
                        <>
                          <span>Join Room</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
