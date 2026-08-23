import { Chat, Message, StatusItem, UserProfile } from '../types';

export const INITIAL_CONTACTS: UserProfile[] = [
  {
    id: 'user_sarah',
    phone: '+1 555-0192',
    countryCode: '+1',
    name: 'Sarah Chen',
    about: 'Design Lead • Building the future 🎨✨',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    online: true,
    lastSeen: Date.now() - 60000,
    safetyNumber: '74829 10482 91024 81920 48201 92830 19284 01928 30192 84019 28301 92830'
  },
  {
    id: 'user_david',
    phone: '+44 7700 900123',
    countryCode: '+44',
    name: 'David Miller',
    about: 'Software Architect & Cryptography Enthusiast 🔐💻',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    online: true,
    lastSeen: Date.now() - 300000,
    safetyNumber: '91820 48102 94810 29384 01928 30192 84019 28301 92830 19284 01928 30192'
  },
  {
    id: 'user_alex',
    phone: '+91 98765 43210',
    countryCode: '+91',
    name: 'Alex Rivera',
    about: 'Exploring the world 📸 🏔️ Offline until Monday',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    online: false,
    lastSeen: Date.now() - 3600000 * 2,
    safetyNumber: '10293 84019 28301 92830 19284 01928 30192 84019 28301 92830 74829 10482'
  },
  {
    id: 'user_elena',
    phone: '+49 151 23456789',
    countryCode: '+49',
    name: 'Elena Rostova',
    about: 'Zero-Knowledge Cryptography researcher 🛡️',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    online: true,
    lastSeen: Date.now() - 120000,
    safetyNumber: '30192 84019 28301 92830 19284 01928 74829 10482 91024 81920 48201 92830'
  },
  {
    id: 'user_marcus',
    phone: '+1 555-0144',
    countryCode: '+1',
    name: 'Marcus Vance',
    about: 'Fullstack Dev & Open Source Contributor 🚀',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    online: true,
    lastSeen: Date.now() - 180000,
    safetyNumber: '48201 92830 19284 01928 30192 84019 28301 92830 74829 10482 91024 81920'
  }
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  chat_sarah: [
    {
      id: 'm_s_1',
      chatId: 'chat_sarah',
      senderId: 'user_sarah',
      senderName: 'Sarah Chen',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      type: 'text',
      content: 'Hey there! 👋 The encrypted chat and Google Auth look sleek!',
      timestamp: Date.now() - 3600000 * 3,
      status: 'read',
      reactions: [{ emoji: '🔥', userId: 'current_user', userName: 'You', timestamp: Date.now() - 3600000 * 2.8 }]
    }
  ]
};

export const INITIAL_CHATS: Chat[] = [
  {
    id: 'chat_sarah',
    type: 'direct',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    about: 'Design Lead • Building the future 🎨✨',
    participants: ['current_user', 'user_sarah'],
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    disappearingTimer: 0,
    createdAt: Date.now() - 3600000 * 24,
    sharedKeyFingerprint: 'CC-AES-789A',
    lastMessage: INITIAL_MESSAGES.chat_sarah[INITIAL_MESSAGES.chat_sarah.length - 1]
  }
];

export const INITIAL_STATUSES: StatusItem[] = [
  {
    id: 'st_sarah_1',
    userId: 'user_sarah',
    userName: 'Sarah Chen',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
    caption: 'Dream workspace in Lisbon 🇵🇹✨',
    timestamp: Date.now() - 1000 * 60 * 30,
    expiresAt: Date.now() + 86400000 - 1000 * 60 * 30,
    viewers: [
      {
        userId: 'current_user',
        userName: 'You',
        userAvatar: '',
        viewedAt: Date.now() - 1000 * 60 * 10
      }
    ]
  },
  {
    id: 'st_alex_1',
    userId: 'user_alex',
    userName: 'Alex Rivera',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    type: 'text',
    content: '“Privacy is not an option, and it shouldn’t be the price we accept for just getting on the Internet.” — Gary Kovacs 🔒',
    backgroundColor: '#075E54',
    fontStyle: 'sans',
    timestamp: Date.now() - 1000 * 60 * 120,
    expiresAt: Date.now() + 86400000 - 1000 * 60 * 120,
    viewers: []
  }
];

export const SMART_AUTO_REPLIES: Record<string, string[]> = {
  user_sarah: [
    "Got it! That looks super clean.",
    "Sounds great! The real-time chat room update synced instantly 🚀",
    "Everything is syncing securely on my end too! 🔒✨",
    "Haha totally agree! Let's do that.",
    "Awesome, the end-to-end encryption verification matches on my device!"
  ],
  user_david: [
    "Confirmed. The AES-GCM-256 cipher integrity check passed.",
    "Nice! The payload was decrypted cleanly from Firestore.",
    "I'll review the pull request and test the cryptographic suite.",
    "Let's schedule a quick encrypted voice call in this room."
  ],
  user_alex: [
    "Just tested across multiple browser tabs, real-time sync is blazing fast! ⚡",
    "Super cool! Thanks for sharing.",
    "Love the ChatRoom UI! Clean and responsive.",
    "Sending some updates from our local session!"
  ],
  user_elena: [
    "Verified the 60-digit safety number fingerprint.",
    "The AES-256-GCM zero-knowledge encryption is working seamlessly.",
    "Great work! No plaintext leakage detected on the server.",
    "Security first! Always encrypt before transmitting."
  ]
};
