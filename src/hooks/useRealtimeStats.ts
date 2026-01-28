'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Stats {
  salamCount: number;
  mobilyCount: number;
  salamDailyCount: number;
  mobilyDailyCount: number;
}

/**
 * Real-time hook for statistics
 * Updates counts when customer data changes
 */
export function useRealtimeStats(initialStats: Stats) {
  const [stats, setStats] = useState<Stats>(initialStats);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Function to fetch updated stats
    const fetchStats = async () => {
      try {
        // Fetch total counts
        const [salamCountResult, mobilyCountResult] = await Promise.all([
          supabase.from('salam_customers').select('*', { count: 'exact', head: true }),
          supabase.from('mobily_customers').select('*', { count: 'exact', head: true }),
        ]);

        // Fetch daily counts
        const today = new Date().toISOString().split('T')[0];
        const [salamDailyResult, mobilyDailyResult] = await Promise.all([
          supabase
            .from('salam_customers')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${today}T00:00:00`)
            .lt('created_at', `${today}T23:59:59`),
          supabase
            .from('mobily_customers')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${today}T00:00:00`)
            .lt('created_at', `${today}T23:59:59`),
        ]);

        setStats({
          salamCount: salamCountResult.count || 0,
          mobilyCount: mobilyCountResult.count || 0,
          salamDailyCount: salamDailyResult.count || 0,
          mobilyDailyCount: mobilyDailyResult.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    // Fetch fresh stats on mount
    fetchStats();

    // Subscribe to changes in both customer tables
    const salamChannel = supabase
      .channel('salam_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'salam_customers',
        },
        () => {
          console.log('Salam customer changed, updating stats...');
          fetchStats();
        }
      )
      .subscribe();

    const mobilyChannel = supabase
      .channel('mobily_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mobily_customers',
        },
        () => {
          console.log('Mobily customer changed, updating stats...');
          fetchStats();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Unsubscribing from stats channels');
      supabase.removeChannel(salamChannel);
      supabase.removeChannel(mobilyChannel);
    };
  }, []); // Empty dependency array - only setup once

  return stats;
}
