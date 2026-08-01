export interface UserProfilePayload {
  id?: number;
  name: string;
  surname: string;
  cin: string;
  phone: string;
  email?: string;
  role?: string;
  status?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileResponse {
  status: string;
  message: string;
}
