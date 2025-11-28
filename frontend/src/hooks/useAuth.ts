import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { login, me, register } from "../api/auth";
import { LoginRequest, RegisterRequest, TokenResponse, User } from "../types/auth";
import { authStore } from "../stores/authStore";

export const useMe = () => {
  return useQuery<User>({
    queryKey: ["me"],
    queryFn: me,
    enabled: !!authStore.getState().accessToken,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation<TokenResponse, unknown, LoginRequest>({
    mutationFn: login,
    onSuccess: (data) => {
      authStore.getState().setSession(data);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation<User, unknown, RegisterRequest>({
    mutationFn: register,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
};
