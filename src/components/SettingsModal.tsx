import React, { useState } from 'react';
import { 
  X, User, ShieldCheck, Lock, Palette, Bell, Volume2, 
  VolumeX, Moon, Sun, Check, LogOut, Key, FileText, Smartphone, Shield 
} from 'lucide-react';
import { AppTheme, UserProfile, WallpaperStyle } from '../types';
import { soundService } from '../services/audio';

interface SettingsModalProps {
  currentUser: UserProfile;
  theme: AppTheme;
  wallpaper: WallpaperStyle;
  blockedUsers: string[];
  allContacts: UserProfile[];
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onUpdateTheme: (theme: AppTheme) => void;
  onUpdateWallpaper: (wallpaper: WallpaperStyle) => void;
  onLogout: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentUser,
  theme,
  wallpaper,
  blockedUsers,
  allContacts,
  onUpdateProfile,
  onUpdateTheme,
  onUpdateWallpaper,
  onLogout,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'chats' | 'notifications' | 'privacy'>('profile');
  const [name, setName] = useState(currentUser.name);
  const [about, setAbout] = useState(currentUser.about);
  const [soundEnabled, setSoundEnabled] = useState(soundService.getSoundEnabled());
  const [keyExported, setKeyExported] = useState(false);

  const handleSaveProfile = () => {
    onUpdateProfile({ name: name.trim(), about: about.trim() });
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundService.setSoundEnabled(next);
  };

  const handleExportCryptoBackup = () => {
    const backupData = {
      user: currentUser.name,
      phone: currentUser.phone,
      publicKey: currentUser.publicKey,
      safetySnippet: currentUser.safetyNumber,
      cipherSuite: 'AES-GCM-256 / PBKDF2-SHA256',
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CipherChat_Keys_${currentUser.name.replace(/\s+/g, '_')}.json`;
    a.click();
    setKeyExported(true);
    setTimeout(() => setKeyExported(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none text-[#1c1e21] font-sans">
      <div className="bg-white border border-[#e4e6eb] rounded-3xl overflow-hidden w-full max-w-2xl shadow-2xl flex flex-col md:flex-row max-h-[85vh]">
        
        {/* Left Tabs Navigation */}
        <div className="w-full md:w-56 bg-[#fafafa] border-r border-[#e4e6eb] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-bold text-base text-[#1c1e21]">Settings</h3>
              <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'security', label: 'Security & E2EE', icon: ShieldCheck },
                { id: 'chats', label: 'Appearance', icon: Palette },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'privacy', label: 'Privacy', icon: Lock }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer text-left ${
                      isActive 
                        ? 'bg-blue-50 text-[#0084ff]' 
                        : 'text-gray-500 hover:bg-gray-100 hover:text-[#1c1e21]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Logout Button */}
          <div className="pt-4 border-t border-[#e4e6eb] mt-4">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-2xl transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Right Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between bg-white">
          
          <div>
            {/* Header with Close on Desktop */}
            <div className="hidden md:flex items-center justify-between pb-4 border-b border-[#e4e6eb] mb-5">
              <h4 className="font-bold text-base text-[#1c1e21] capitalize">{activeTab}</h4>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#e4e6eb] shadow-sm"
                  />
                  <div>
                    <div className="text-sm font-bold text-[#1c1e21]">{currentUser.name}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{currentUser.phone}</div>
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full inline-block mt-1">
                      Verified Identity
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-[#0084ff]/30 focus:border-[#0084ff] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      About Status
                    </label>
                    <input
                      type="text"
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-[#0084ff]/30 focus:border-[#0084ff] focus:outline-none transition"
                    />
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-[#0084ff] text-white font-bold text-xs rounded-xl hover:bg-[#0073e6] shadow-sm transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* TAB: SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200/60 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-green-800 font-bold text-xs">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    <span>Hardware Web Crypto Active</span>
                  </div>
                  <p className="text-xs text-green-700 leading-relaxed">
                    All conversations use AES-GCM 256-bit encryption keys stored in memory and indexedDB sandbox.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500">Public Key Fingerprint</span>
                    <span className="font-mono text-[10px] bg-gray-100 px-2 py-1 rounded-lg">
                      {currentUser.publicKey?.slice(0, 16)}...
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500">Safety Number Snippet</span>
                    <span className="font-mono text-[10px] bg-gray-100 px-2 py-1 rounded-lg">
                      {currentUser.safetyNumber}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleExportCryptoBackup}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-[#1c1e21] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Key className="w-4 h-4 text-[#0084ff]" />
                    <span>{keyExported ? 'Backup Downloaded!' : 'Export Cryptographic Key Backup'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: CHATS & APPEARANCE */}
            {activeTab === 'chats' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Design Theme
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onUpdateTheme('light')}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                        theme === 'light' ? 'border-[#0084ff] bg-blue-50 text-[#0084ff]' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                      <span className="text-xs font-bold">Sleek Light</span>
                    </button>
                    <button
                      onClick={() => onUpdateTheme('dark')}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                        theme === 'dark' ? 'border-[#0084ff] bg-blue-50 text-[#0084ff]' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      <span className="text-xs font-bold">Sleek Dark</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Chat Wallpaper
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'default', label: 'Clean White', bg: 'bg-[#fafafa]' },
                      { id: 'doodle-light', label: 'Subtle Grid', bg: 'bg-gray-100' },
                      { id: 'navy', label: 'Soft Slate', bg: 'bg-slate-100' }
                    ].map(wp => (
                      <button
                        key={wp.id}
                        onClick={() => onUpdateWallpaper(wp.id as any)}
                        className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                          wallpaper === wp.id ? 'border-[#0084ff] ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-full h-8 rounded-xl ${wp.bg} mb-1.5 border border-gray-200 flex items-center justify-center`}>
                          {wallpaper === wp.id && <Check className="w-3.5 h-3.5 text-[#0084ff]" />}
                        </div>
                        <span className="text-[11px] font-medium text-gray-600">{wp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    {soundEnabled ? <Volume2 className="w-5 h-5 text-[#0084ff]" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
                    <div>
                      <div className="text-xs font-bold text-[#1c1e21]">Audio Sound Effects</div>
                      <div className="text-[10px] text-gray-500">Play send/receive synth alerts</div>
                    </div>
                  </div>
                  <button
                    onClick={toggleSound}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      soundEnabled ? 'bg-[#0084ff]' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      soundEnabled ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB: PRIVACY */}
            {activeTab === 'privacy' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Blocked Contacts ({blockedUsers.length})
                </div>
                {blockedUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
                    No blocked contacts
                  </div>
                ) : (
                  blockedUsers.map(bId => {
                    const c = allContacts.find(contact => contact.id === bId);
                    return (
                      <div key={bId} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                        <span className="text-xs font-semibold">{c ? c.name : bId}</span>
                        <span className="text-[10px] text-red-500 font-bold uppercase">Blocked</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>

          <div className="pt-4 border-t border-[#e4e6eb] mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#1c1e21] text-white font-bold text-xs rounded-xl hover:bg-black transition cursor-pointer"
            >
              Done
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
