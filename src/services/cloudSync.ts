import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, signOutAuth } from './firebase';
import { storage } from './storage';
import { Chat, Message } from '../types';

const activeSubscriptions = new Map<string, () => void>();
let installed = false;

function directChatId(participants: string[]): string {
  return `direct_${[...participants].sort().join('_')}`;
}

function normalizeDirectChat(chat: Chat): Chat {
  if (chat.type !== 'direct' || chat.participants.length !== 2) return chat;
  return { ...chat, id: directChatId(chat.participants) };
}

function isDirectChat(chat: Chat | undefined): chat is Chat {
  return !!chat && chat.type === 'direct' && chat.participants.length === 2;
}

export function installCloudSyncBridge(): () => void {
  if (typeof window === 'undefined' || installed) return () => {};
  installed = true;

  const originalCreateChat = storage.createChat.bind(storage);
  const originalSendMessage = storage.sendMessage.bind(storage);
  const originalLogout = storage.logout.bind(storage);

  storage.createChat = ((input: Chat) => {
    const chat = normalizeDirectChat(input);
    const result = originalCreateChat(chat);
    const uid = auth.currentUser?.uid;
    if (isDirectChat(chat) && uid && chat.participants.includes(uid)) {
      void setDoc(doc(db, 'directChats', chat.id), { ...chat, updatedAt: Date.now() }, { merge: true })
        .catch((error) => console.warn('Direct chat sync failed:', error));
    }
    return result;
  }) as typeof storage.createChat;

  storage.sendMessage = (async (chatId: string, messageData: Partial<Message>) => {
    const chat = storage.getChat(chatId);
    const result = await originalSendMessage(chatId, messageData);
    const uid = auth.currentUser?.uid;
    if (!isDirectChat(chat) || !uid || !chat.participants.includes(uid)) return result;

    try {
      await setDoc(doc(db, 'directChats', chat.id, 'messages', result.id), {
        ...result,
        content: '[E2EE Ciphertext]',
        encryptedPayload: result.encryptedPayload || null,
      }, { merge: true });
      await updateDoc(doc(db, 'directChats', chat.id), {
        lastMessage: { ...result, content: '[E2EE Ciphertext]' },
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.warn('Direct message sync failed:', error);
    }
    return result;
  }) as typeof storage.sendMessage;

  storage.logout = (() => {
    originalLogout();
    void signOutAuth().catch((error) => console.warn('Firebase sign-out failed:', error));
  }) as typeof storage.logout;

  const stopAll = () => {
    activeSubscriptions.forEach((unsubscribe) => unsubscribe());
    activeSubscriptions.clear();
  };

  const unsubscribeAuth = auth.onAuthStateChanged((user) => {
    stopAll();
    if (!user) return;

    const chatsQuery = query(
      collection(db, 'directChats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(100),
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') return;
        const chat = { ...(change.doc.data() as Chat), id: change.doc.id };
        originalCreateChat(chat);
        const key = `messages:${chat.id}`;
        if (activeSubscriptions.has(key)) return;

        const messagesQuery = query(
          collection(db, 'directChats', chat.id, 'messages'),
          orderBy('timestamp', 'asc'),
          limit(150),
        );
        const unsubscribeMessages = onSnapshot(messagesQuery, (messageSnapshot) => {
          const messages: Message[] = messageSnapshot.docs.map((messageDoc) => ({
            ...(messageDoc.data() as Message),
            id: messageDoc.id,
            chatId: chat.id,
          }));
          storage.saveMessages(chat.id, messages);
        }, (error) => console.warn(`Direct message listener failed for ${chat.id}:`, error));
        activeSubscriptions.set(key, unsubscribeMessages);
      });
    }, (error) => console.warn('Direct chat listener failed:', error));

    activeSubscriptions.set('__chats__', unsubscribeChats);
  });

  return () => {
    unsubscribeAuth();
    stopAll();
    installed = false;
  };
}
