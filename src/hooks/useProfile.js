import { create } from 'zustand';
import { supabase } from '@/lib/customSupabaseClient';

export const useProfileStore = create((set, get) => ({
  profile: null,
  loading: true,
  fetchProfile: async (userId, force = false) => {
    if (!userId) {
      set({ profile: null, loading: false });
      return null;
    }

    const currentProfile = get().profile;
    if (currentProfile && currentProfile.id === userId && !get().loading && !force) {
      return currentProfile;
    }

    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw error;
      }
      
      set({ profile: data, loading: false });
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ profile: null, loading: false });
      return null;
    }
  },
  clearProfile: () => set({ profile: null, loading: true }),
}));