export type UserRole = "superadmin" | "manager" | "client";

export type VerificationStatus = "pending_documents" | "pending_review" | "verified" | "rejected";

export interface User {
  id: string;
  email?: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  verification_status: VerificationStatus;
  phone?: string;
  rejection_reason?: string;
  ine_front_file_id?: string;
  ine_back_file_id?: string;
  ine_selfie_file_id?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email?: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user: User;
}
