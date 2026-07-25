export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  userId: number;
}

export interface RegisterRequest {
  name: string;
  surname: string;
  cin: string;
  phone: string;
  email: string;
  password?: string;
  role: string;
  status: string;
}

export interface RegisterResponse {
  message: string;
  status: string;
}
