import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { InventoryMovement } from '../types';
import { getProductByAlias, updateProduct } from './productService';

const MOVEMENTS_COLLECTION = 'inventoryMovements';

export async function logInventoryMovement(movement: Omit<InventoryMovement, 'id' | 'createdAt'>): Promise<InventoryMovement> {
  const docId = `mv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const entry: InventoryMovement = {
    ...movement,
    id: docId,
    createdAt: now
  };

  try {
    await setDoc(doc(db, MOVEMENTS_COLLECTION, docId), entry);
    return entry;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${MOVEMENTS_COLLECTION}/${docId}`);
  }
}

export async function getInventoryMovements(maxCount = 100): Promise<InventoryMovement[]> {
  try {
    const q = query(collection(db, MOVEMENTS_COLLECTION), orderBy('createdAt', 'desc'), limit(maxCount));
    const snapshot = await getDocs(q);
    const movements: InventoryMovement[] = [];
    snapshot.forEach(docSnap => {
      movements.push({ id: docSnap.id, ...docSnap.data() } as InventoryMovement);
    });
    return movements;
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    return [];
  }
}

export async function adjustVariantStock(
  productAlias: string,
  sizeLabel: string,
  quantityChange: number,
  type: InventoryMovement['type'],
  reason: string,
  performedBy: string,
  orderId?: string
): Promise<{ previousStock: number; newStock: number }> {
  const product = await getProductByAlias(productAlias);
  if (!product) {
    throw new Error(`Không tìm thấy sản phẩm ${productAlias}`);
  }

  const sizes = [...product.sizes];
  const sizeIdx = sizes.findIndex(s => s.label === sizeLabel);
  if (sizeIdx === -1) {
    throw new Error(`Không tìm thấy size ${sizeLabel} cho sản phẩm ${product.name}`);
  }

  const prev = sizes[sizeIdx].quantity || 0;
  const next = Math.max(0, prev + quantityChange);

  sizes[sizeIdx] = {
    ...sizes[sizeIdx],
    quantity: next,
    available: next > 0
  };

  const isAnyAvailable = sizes.some(s => s.available && s.quantity > 0);
  await updateProduct(product.alias, {
    sizes,
    available: isAnyAvailable
  });

  await logInventoryMovement({
    productAlias: product.alias,
    productName: product.name,
    sku: sizes[sizeIdx].sku || product.sku,
    size: sizeLabel,
    type,
    quantityChange,
    previousStock: prev,
    newStock: next,
    reason,
    performedBy,
    orderId
  });

  return { previousStock: prev, newStock: next };
}
