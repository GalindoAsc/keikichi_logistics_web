import { create } from "zustand";
import { User, TokenResponse } from "../types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (token: TokenResponse) => void;
  setTokens: (access: string, refresh?: string | null) => void;
  logout: () => void;
}

export const authStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  setSession: (token) => set({ user: token.user, accessToken: token.access_token, refreshToken: token.refresh_token ?? null }),
  setTokens: (access, refresh) => set((state) => ({ user: state.user, accessToken: access, refreshToken: refresh ?? state.refreshToken })),
  logout: () => set({ user: null, accessToken: null, refreshToken: null }),
}));
