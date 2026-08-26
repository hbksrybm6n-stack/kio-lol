import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface AuthState {
  user: { id: string; email: string; username?: string; displayName?: string; avatarUrl?: string; role?: string } | null;
  profile: Record<string, any> | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: AuthState['user']) => void;
  setProfile: (profile: Record<string, any>) => void;
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  initialize: async () => {
    try {
      const token = localStorage.getItem('kio_token');
      if (token) {
        const data = await authApi.getMe();
        const profile = data.profile;
        set({
          user: {
            id: data.user.id,
            email: data.user.email,
            username: profile?.username,
            displayName: profile?.display_name,
            avatarUrl: profile?.avatar_url,
            profileId: profile?.id,
            role: data.user.role,
          } as any,
          profile: profile,
        });
      }
    } catch {
      localStorage.removeItem('kio_token');
    } finally {
      set({ loading: false, initialized: true });
    }
  },
  refreshProfile: async () => {
    try {
      const data = await authApi.getMe();
      const profile = data.profile;
      set({
        user: {
          id: data.user.id,
          email: data.user.email,
          username: profile?.username,
          displayName: profile?.display_name,
          avatarUrl: profile?.avatar_url,
          profileId: profile?.id,
          role: data.user.role,
        } as any,
        profile: profile,
      });
    } catch {}
  },
  signOut: async () => {
    authApi.logout();
    set({ user: null, profile: null });
  },
}));
