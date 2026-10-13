import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Banner, StoreSettings } from '../types';
import { INITIAL_BANNERS, INITIAL_SETTINGS } from '../data/initialProducts';

const SETTINGS_COLLECTION = 'storeSettings';
const BANNERS_COLLECTION = 'banners';

export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const docSnap = await getDoc(doc(db, SETTINGS_COLLECTION, 'general'));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as StoreSettings;
    }
    // Seed default settings
    await setDoc(doc(db, SETTINGS_COLLECTION, 'general'), INITIAL_SETTINGS);
    return { id: 'general', ...INITIAL_SETTINGS };
  } catch (error) {
    console.warn('Using default store settings fallback:', error);
    return { id: 'general', ...INITIAL_SETTINGS };
  }
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
  try {
    await setDoc(doc(db, SETTINGS_COLLECTION, 'general'), settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/general`);
  }
}

export async function fetchBanners(): Promise<Banner[]> {
  try {
    const q = query(collection(db, BANNERS_COLLECTION), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      for (const banner of INITIAL_BANNERS) {
        await setDoc(doc(db, BANNERS_COLLECTION, banner.id), banner);
      }
      return INITIAL_BANNERS;
    }

    const banners: Banner[] = [];
    snapshot.forEach(docSnap => {
      banners.push({ id: docSnap.id, ...docSnap.data() } as Banner);
    });
    return banners;
  } catch (error) {
    console.warn('Using initial banners fallback:', error);
    return INITIAL_BANNERS;
  }
}

export async function saveBanner(banner: Banner): Promise<void> {
  const docId = banner.id || `b-${Date.now()}`;
  try {
    await setDoc(doc(db, BANNERS_COLLECTION, docId), { ...banner, id: docId });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${BANNERS_COLLECTION}/${docId}`);
  }
}
