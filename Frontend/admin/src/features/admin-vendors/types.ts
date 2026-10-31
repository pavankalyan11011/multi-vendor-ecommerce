export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export type VendorApplicationListItem = {
  id: string;
  userId: string;
  shopName: string;
  slug: string;
  description: string;
  supportEmail: string;
  phone: string;
  applicationStatus: ApplicationStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  documents: Array<{
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
  }>;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};
