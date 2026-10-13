import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';

const PRODUCTS_COLLECTION = 'products';

export async function fetchProducts(): Promise<Product[]> {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Auto-seed initial catalog to Firestore
      await seedProducts();
      return INITIAL_PRODUCTS;
    }

    const products: Product[] = [];
    snapshot.forEach(docSnap => {
      products.push({ id: docSnap.id, ...docSnap.data() } as Product);
    });
    return products;
  } catch (error) {
    console.warn('Failed to fetch from Firestore, falling back to local initial products:', error);
    return INITIAL_PRODUCTS;
  }
}

export async function seedProducts(): Promise<void> {
  try {
    for (const prod of INITIAL_PRODUCTS) {
      const docId = String(prod.alias || prod.id);
      await setDoc(doc(db, PRODUCTS_COLLECTION, docId), {
        ...prod,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error seeding initial products to Firestore:', error);
  }
}

export async function getProductByAlias(alias: string): Promise<Product | null> {
  try {
    const docSnap = await getDoc(doc(db, PRODUCTS_COLLECTION, alias));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    const local = INITIAL_PRODUCTS.find(p => p.alias === alias);
    return local || null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${PRODUCTS_COLLECTION}/${alias}`);
  }
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const docId = product.alias || `sp-${Date.now()}`;
  const now = new Date().toISOString();
  const newProduct: Product = {
    ...product,
    id: docId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, PRODUCTS_COLLECTION, docId), newProduct);
    return newProduct;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${PRODUCTS_COLLECTION}/${docId}`);
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}
