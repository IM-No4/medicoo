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
