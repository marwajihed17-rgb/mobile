'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Operator } from '@/types/database';

/**
 * Real-time hook for operator users (profiles with role='operator')
 * Automatically syncs with database changes (INSERT, UPDATE, DELETE)
 * Used to populate the المشغل dropdown in the dashboard
 */
export function useRealtimeOperators() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch operators from API
  const fetchOperators = useCallback(async () => {
    try {
      const response = await fetch('/api/operators');
      const data = await response.json();
      if (data.operators) {
        setOperators(data.operators);
      }
    } catch (err) {
      console.error('Error fetching operators:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchOperators();

    const supabase = getSupabaseClient();

    // Subscribe to real-time changes on profiles table
    // Filter for operator role changes
    const channel = supabase
      .channel('operator_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('Profile change received:', payload);

          // Check if the change involves an operator role
          const newProfile = payload.new as { id: string; username: string; full_name: string | null; role: string; status: string } | null;
          const oldProfile = payload.old as { id: string; role: string } | null;

          if (payload.eventType === 'INSERT') {
            // If new profile is an active operator, add to list
            if (newProfile?.role === 'operator' && newProfile?.status === 'active') {
              const newOperator: Operator = {
                id: newProfile.id,
                name: newProfile.username || newProfile.full_name || 'المشغل',
              };
              setOperators((prev) => [...prev, newOperator].sort((a, b) => a.name.localeCompare(b.name)));
            }
          } else if (payload.eventType === 'UPDATE') {
            const wasOperator = oldProfile?.role === 'operator';
            const isOperator = newProfile?.role === 'operator';
            const isActive = newProfile?.status === 'active';

            if (isOperator && isActive && !wasOperator) {
              // User became an operator, add to list
              const newOperator: Operator = {
                id: newProfile!.id,
                name: newProfile!.username || newProfile!.full_name || 'المشغل',
              };
              setOperators((prev) => [...prev, newOperator].sort((a, b) => a.name.localeCompare(b.name)));
            } else if (wasOperator && (!isOperator || !isActive)) {
              // User is no longer an active operator, remove from list
              setOperators((prev) => prev.filter((op) => op.id !== oldProfile!.id));
            } else if (isOperator && isActive) {
              // Operator details updated, update in list
              setOperators((prev) =>
                prev.map((op) =>
                  op.id === newProfile!.id
                    ? { ...op, name: newProfile!.username || newProfile!.full_name || 'المشغل' }
                    : op
                )
              );
            }
          } else if (payload.eventType === 'DELETE') {
            // If deleted profile was an operator, remove from list
            if (oldProfile?.role === 'operator') {
              setOperators((prev) => prev.filter((op) => op.id !== oldProfile.id));
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Operator profiles subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Unsubscribing from operator profiles');
      supabase.removeChannel(channel);
    };
  }, [fetchOperators]);

  return { operators, isConnected, isLoading, refetch: fetchOperators };
}
