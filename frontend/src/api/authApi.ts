import api from "./client";

export type UserRole = "business" | "influencer";

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
  refreshToken: string;
};

export const authApi = {
  register: async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<AuthResponse> => {
    const { data } = await api.post("/auth/register", { name, email, password, role });
    return data.data;
  },

  login: async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<AuthResponse> => {
    const { data } = await api.post("/auth/login", { email, password, role });
    return data.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    const { data } = await api.post("/auth/refresh", { refreshToken });
    return data.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const { data } = await api.get("/auth/me");
    return data.data.user;
  },
};
