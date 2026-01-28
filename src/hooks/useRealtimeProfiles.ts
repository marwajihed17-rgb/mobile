'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { scrollToTop } from '@/utils/scroll';
import type { Profile } from '@/types/database';

/**
 * Real-time hook for user profiles
 * Fetches fresh data on mount and automatically syncs with database changes
 */
export function useRealtimeProfiles(initialData: Profile[]) {
  const [profiles, setProfiles] = useState<Profile[]>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch fresh data from database
  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      if (data) {
        setProfiles(data as Profile[]);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch fresh data on mount
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Subscribe to real-time changes
  useEffect(() => {
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('Profile change received:', payload);

          if (payload.eventType === 'INSERT') {
            const newProfile = payload.new as Profile;
            setProfiles((prev) => {
              // Avoid duplicates
              if (prev.some(p => p.id === newProfile.id)) {
                return prev;
              }
              return [newProfile, ...prev];
            });
            scrollToTop();
          } else if (payload.eventType === 'UPDATE') {
            const updatedProfile = payload.new as Profile;
            setProfiles((prev) =>
              prev.map((profile) =>
                profile.id === updatedProfile.id ? updatedProfile : profile
              )
            );
            scrollToTop();
          } else if (payload.eventType === 'DELETE') {
            const deletedProfile = payload.old as Profile;
            setProfiles((prev) =>
              prev.filter((profile) => profile.id !== deletedProfile.id)
            );
            scrollToTop();
          }
        }
      )
      .subscribe((status) => {
        console.log('Profiles subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('Unsubscribing from profiles');
      supabase.removeChannel(channel);
    };
  }, []);

  return { profiles, isConnected, isLoading, refetch: fetchProfiles };
}
