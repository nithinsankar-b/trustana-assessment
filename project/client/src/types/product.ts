// client/src/types/product.ts
export interface Product {
    id: number;
    name: string;
    brand: string;
    barcode: string | null;
    images: string[];
    attributes: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ProductFormData {
    name: string;
    brand: string;
    barcode?: string;
    images: string[];
  }