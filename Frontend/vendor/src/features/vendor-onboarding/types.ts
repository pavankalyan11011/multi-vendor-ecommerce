export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export type VendorApplication = {
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
  reviewedBy: string | null;
  documents: Array<{
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};
