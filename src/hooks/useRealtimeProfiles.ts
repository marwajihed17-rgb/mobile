'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

/**
 * Real-time hook for user profiles
 * Automatically syncs with database changes (INSERT, UPDATE, DELETE)
 */
export function useRealtimeProfiles(initialData: Profile[]) {
  const [profiles, setProfiles] = useState<Profile[]>(initialData);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('Profile change received:', payload);

          if (payload.eventType === 'INSERT') {
            // Add new profile to the list
            const newProfile = payload.new as Profile;
            setProfiles((prev) => [newProfile, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing profile
            const updatedProfile = payload.new as Profile;
            setProfiles((prev) =>
              prev.map((profile) =>
                profile.id === updatedProfile.id ? updatedProfile : profile
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted profile
            const deletedProfile = payload.old as Profile;
            setProfiles((prev) =>
              prev.filter((profile) => profile.id !== deletedProfile.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Profiles subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Unsubscribing from profiles');
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array - only setup once

  return { profiles, isConnected };
}
