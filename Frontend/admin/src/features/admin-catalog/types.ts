export type CategoryStatus = "ACTIVE" | "INACTIVE";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  ancestors: string[];
  level: number;
  path: string;
  image: {
    originalName: string;
    storedName: string;
    mimeType: string;
    size: number;
  } | null;
  icon: string | null;
  status: CategoryStatus;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type CategoryTreeNode = Category & { children: CategoryTreeNode[] };

export type AttributeDataType =
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "ENUM"
  | "MULTI_SELECT"
  | "DATE";

export type AttributeInputType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "SELECT"
  | "MULTI_SELECT"
  | "CHECKBOX"
  | "DATE";

export type AttributeOption = { value: string; label: string };

export type Attribute = {
  id: string;
  name: string;
  code: string;
  description: string;
  dataType: AttributeDataType;
  inputType: AttributeInputType;
  options: AttributeOption[];
  unit: string | null;
  validation: Record<string, unknown>;
  status: CategoryStatus;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type CategoryAttributeAssignment = {
  id: string;
  categoryId: string;
  attributeId: string;
  required: boolean;
  filterable: boolean;
  searchable: boolean;
  variantDefining: boolean;
  displayOrder: number;
  validationOverrides: Record<string, unknown> | null;
};

export type FormSchemaField = {
  attributeId: string;
  code: string;
  name: string;
  description: string;
  dataType: AttributeDataType;
  inputType: AttributeInputType;
  required: boolean;
  filterable: boolean;
  searchable: boolean;
  variantDefining: boolean;
  options: AttributeOption[];
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

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type AuditEntry = {
  id: string;
  action: string;
  actorId: string;
  meta: unknown;
  createdAt: string;
};
