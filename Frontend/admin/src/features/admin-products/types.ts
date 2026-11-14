export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  status: string;
  basePrice: number | null;
  currency: string;
  vendorId: string;
  categoryId: string;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  updatedAt?: string;
  vendor?: { id: string; fullName: string; email: string } | null;
  hasPublishedSnapshot?: boolean;
};

export type AdminProductDetail = AdminProductListItem & {
  description?: string;
  variants?: Array<{
    id: string;
    sku: string;
    price: number;
    stockQuantity: number;
    availability: string;
  }>;
  media?: Array<{
    id: string;
    originalName: string;
    storedName: string;
    isPrimary: boolean;
  }>;
  publishedSnapshot?: unknown;
  pendingRevision?: {
    id: string;
    status: string;
    proposed?: unknown;
    createdAt?: string;
  } | null;
};
