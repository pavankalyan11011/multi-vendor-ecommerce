export type ProductStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED";

export type FormSchemaField = {
  attributeId: string;
  code: string;
  name: string;
  description: string;
  dataType: string;
  inputType: string;
  required: boolean;
  filterable: boolean;
  searchable: boolean;
  variantDefining: boolean;
  options: Array<{ value: string; label: string }>;
  unit: string | null;
  validation: Record<string, unknown>;
  displayOrder: number;
  sourceCategoryId: string;
  attributeSchemaVersion: number;
};

export type FormSchema = {
  categoryId: string;
  categoryName: string;
  categoryPath: string;
  schemaVersion: number;
  fields: FormSchemaField[];
};

export type CategoryTreeNode = {
  id: string;
  name: string;
  path: string;
  level: number;
  parentId: string | null;
  status: string;
  children: CategoryTreeNode[];
};

export type ProductVariant = {
  id: string;
  sku: string;
  options: Record<string, string>;
  price: number;
  currency: string;
  stockQuantity: number;
  availability: string;
};

export type ProductMedia = {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  sortOrder: number;
  isPrimary: boolean;
};

export type AttributeValue = {
  attributeId: string;
  code: string;
  attributeSchemaVersion: number;
  value: unknown;
};

export type Product = {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  status: ProductStatus;
  categorySchemaVersion: number;
  attributeValues: AttributeValue[];
  schemaOutdated: boolean;
  currency: string;
  basePrice: number | null;
  hasVariants: boolean;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[];
  media?: ProductMedia[];
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
