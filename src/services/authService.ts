import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';

const USERS_COLLECTION = 'users';
const ADMINS_COLLECTION = 'admins';
export const BOOTSTRAP_ADMIN_EMAIL = 'imperblorius@gmail.com';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docSnap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function checkIsAdmin(user: FirebaseUser | null, profile?: UserProfile | null): Promise<boolean> {
  if (!user) return false;
  if (user.email === BOOTSTRAP_ADMIN_EMAIL) return true;
  if (profile?.role === 'ADMIN') return true;

  try {
    const adminDoc = await getDoc(doc(db, ADMINS_COLLECTION, user.uid));
    return adminDoc.exists();
  } catch {
    return false;
  }
}

export async function syncUserProfile(firebaseUser: FirebaseUser, customName?: string): Promise<UserProfile> {
  const uid = firebaseUser.uid;
  const email = firebaseUser.email || '';
  const isAdminUser = email === BOOTSTRAP_ADMIN_EMAIL;

  const existing = await getUserProfile(uid);
  const now = new Date().toISOString();

  const profileData: UserProfile = {
    uid,
    email,
    displayName: customName || firebaseUser.displayName || existing?.displayName || email.split('@')[0],
    role: isAdminUser ? 'ADMIN' : (existing?.role || 'CUSTOMER'),
    phone: existing?.phone || '',
    address: existing?.address || '',
    city: existing?.city || '',
    savedAddresses: existing?.savedAddresses || [],
    favorites: existing?.favorites || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, USERS_COLLECTION, uid), profileData, { merge: true });

    // If admin, also ensure document in /admins/{uid} exists for security rules
    if (isAdminUser || profileData.role === 'ADMIN') {
      try {
        await setDoc(doc(db, ADMINS_COLLECTION, uid), {
          uid,
          email,
          role: 'ADMIN',
          createdAt: now
        }, { merge: true });
      } catch (err) {
        console.warn('Could not write admin record:', err);
      }
    }

    return profileData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COLLECTION}/${uid}`);
  }
}

export async function registerWithEmail(name: string, email: string, pass: string): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }
  return await syncUserProfile(cred.user, name);
}

export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return await syncUserProfile(cred.user);
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return await syncUserProfile(cred.user);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function resetUserPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${uid}`);
  }
}
