import api from "./client";
import { LoginRequest, RegisterRequest, TokenResponse, User } from "../types/auth";

export const login = async (payload: LoginRequest): Promise<TokenResponse> => {
  const { data } = await api.post<TokenResponse>("/auth/login", payload);
  return data;
};

export const register = async (payload: RegisterRequest): Promise<User> => {
  const { data } = await api.post<User>("/auth/register", payload);
  return data;
};

export const me = async (): Promise<User> => {
  const { data } = await api.get<User>("/auth/me");
  return data;
};
