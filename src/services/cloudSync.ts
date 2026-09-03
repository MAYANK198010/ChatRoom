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

/**
 * Bridges the existing local-first UI with Firestore for direct chats.
 * The UI can keep its local cache while authenticated users get cross-device
 * chat persistence and realtime updates.
 */

const activeMessageSubscriptions = new Map<string, () => void>();

function directChatId(participants: string[]): string {
  return `direct_${[...participants].sort().join('_')}`;
}

function normalizeDirectChat(chat: Chat): Chat {
  if (chat.type !== 'direct' || chat.participants.length !== 2) return chat;
  return {
    ...chat,
    id: directChatId(chat.participants),
  };
}

function isDirectChat(chat: Chat | undefined): chat is Chat {
  return !!chat && chat.type === 'direct' && chat.participants.length === 2;
}

export function installCloudSyncBridge(): void {
  if (typeof window === 'undefined') return;

  const originalCreateChat = storage.createChat.bind(storage);
  const originalSendMessage = storage.sendMessage.bind(storage);
  const originalLogout = storage.logout.bind(storage);

  storage.createChat = ((input: Chat) => {
    const chat = normalizeDirectChat(input);
    const result = originalCreateChat(chat);

    if (isDirectChat(chat) && auth.currentUser) {
      void setDoc(doc(db, 'directChats', chat.id), {
        ...chat,
        participants: chat.participants,
        updatedAt: Date.now(),
      }, { merge: true }).catch((error) => {
        console.warn('Direct chat sync failed:', error);
      });
    }

    return result;
  }) as typeof storage.createChat;

  storage.sendMessage = (async (chatId: string, messageData: Partial<Message>) => {
    const chat = storage.getChat(chatId);
    const result = await originalSendMessage(chatId, messageData);

    if (!isDirectChat(chat) || !auth.currentUser) return result;

    const cloudMessage = {
      ...result,
      content: '[E2EE Ciphertext]',
      encryptedPayload: result.encryptedPayload || null,
    };

    try {
      await setDoc(
        doc(db, 'directChats', chat.id, 'messages', result.id),
        cloudMessage,
        { merge: true },
      );
      await updateDoc(doc(db, 'directChats', chat.id), {
        lastMessage: cloudMessage,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.warn('Direct message sync failed:', error);
    }

    return result;
  }) as typeof storage.sendMessage;

  storage.logout = (() => {
    originalLogout();
    void signOutAuth().catch((error) => {
      console.warn('Firebase sign-out failed:', error);
    });
  }) as typeof storage.logout;

  auth.onAuthStateChanged((user) => {
    activeMessageSubscriptions.forEach((unsubscribe) => unsubscribe());
    activeMessageSubscriptions.clear();

    if (!user) return;

    const chatsQuery = query(
      collection(db, 'directChats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(100),
    );

    onSnapshot(chatsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data() as Chat;
        const chat: Chat = { ...data, id: change.doc.id };
        originalCreateChat(chat);

        if (change.type === 'removed') return;
        if (activeMessageSubscriptions.has(chat.id)) return;

        const messagesQuery = query(
          collection(db, 'directChats', chat.id, 'messages'),
          orderBy('timestamp', 'asc'),
          limit(150),
        );

        const unsubscribe = onSnapshot(messagesQuery, (messageSnapshot) => {
          const messages: Message[] = messageSnapshot.docs.map((messageDoc) => ({
            ...(messageDoc.data() as Message),
            id: messageDoc.id,
            chatId: chat.id,
          }));
          storage.saveMessages(chat.id, messages);
        }, (error) => {
          console.warn(`Direct message listener failed for ${chat.id}:`, error);
        });

        activeMessageSubscriptions.set(chat.id, unsubscribe);
      });
    }, (error) => {
      console.warn('Direct chat listener failed:', error);
    });
  });
}
