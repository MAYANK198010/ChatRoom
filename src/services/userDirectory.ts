import { signInAnonymously } from 'firebase/auth';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { auth, db, syncUserProfileToFirestore } from './firebase';
import { UserProfile } from '../types';

/** Ensure Firestore requests have an authenticated Firebase identity. */
export async function ensureFirebaseAuth() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

/** Persist a profile using the Firebase Auth UID as its canonical user id. */
export async function saveUserProfile(profile: UserProfile): Promise<UserProfile> {
  const firebaseUser = await ensureFirebaseAuth();
  const canonical: UserProfile = {
    ...profile,
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
  };
  await syncUserProfileToFirestore(canonical);
  return canonical;
}

/**
 * Search the public user directory. Firestore does not provide arbitrary
 * substring search, so the app fetches a bounded public directory and
 * performs case-insensitive matching on the client.
 */
export async function searchUsers(term: string, currentUserId?: string): Promise<UserProfile[]> {
  await ensureFirebaseAuth();
  const snapshot = await getDocs(query(collection(db, 'users'), limit(250)));
  const normalized = term.trim().toLowerCase();

  return snapshot.docs
    .map((item) => ({ ...(item.data() as UserProfile), id: item.id, uid: item.id }))
    .filter((user) => user.id !== currentUserId)
    .filter((user) => {
      if (!normalized) return true;
      return [user.name, user.email, user.phone, user.about]
        .some((value) => String(value || '').toLowerCase().includes(normalized));
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
