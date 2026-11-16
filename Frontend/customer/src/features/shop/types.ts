export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  description?: string;
  currency: string;
  basePrice: number | null;
  hasVariants?: boolean;
  variants?: Array<{
    id: string;
    sku: string;
    price: number;
    currency?: string;
    stockQuantity: number;
    availability: string;
    options?: Record<string, string>;
  }>;
  media?: Array<{
    id: string;
    storedName: string;
    originalName: string;
    isPrimary?: boolean;
  }>;
  frozenAt?: string;
};

export type CartItem = {
  id: string;
  productId: string;
  variantId: string | null;
  vendorId: string;
  title: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
};

export type Cart = {
  id: string;
  customerId: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  currency: string;
  updatedAt?: string;
};

export type ShippingAddress = {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  country?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  items: Array<{
    id: string;
    title: string;
    variantLabel?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    currency: string;
    fulfillmentStatus: string;
  }>;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  shippingAddress: ShippingAddress;
  paidAt?: string | null;
  createdAt?: string;
};
