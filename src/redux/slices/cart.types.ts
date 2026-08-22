// cart.types.ts (recommended)
export type CartItem = {
  sku: number | string;
  medicineId: string;
  name: string;
  price: number;
  discountPrice: number;
  quantity: number;
  brand?: string;
  composition?: string;
  batchId?: string;
  expiryDate?: string | null;
  prescriptionRequired?: boolean;
  image?: string;
};

export type StoreCart = {
  storeId: string;
  storeName: string;
  items: Record<string, CartItem>;
};

export type CartState = Record<string, StoreCart>;

// A prescription attached to a store's cart to satisfy prescriptionRequired
// items, from one of three sources: a freshly-uploaded image/document, an
// existing document from the user's library, or a doctor-issued record from
// a consultation. "image" and "document" both end up backed by a
// UserDocument (uploadDocument tags new uploads with documentType:
// 'prescription' too), "doctor" instead points at a PrescribedMedicine
// record - kept distinct so the order payload's prescription_mode can tell
// the backend which kind it's looking at.
export type AttachedPrescription = {
  mode: 'image' | 'document' | 'doctor';
  documentId?: string;
  prescriptionId?: string;
  uri?: string;
  label: string;
};
