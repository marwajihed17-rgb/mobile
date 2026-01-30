'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Stats {
  salamCount: number;
  mobilyCount: number;
  salamDailyCount: number;
  mobilyDailyCount: number;
  // New fields for tracking with daily reset
  salamTotalWithBaseline: number; // إجمالي – مشروع سلام (baseline + today's count)
  mobilyTotalWithBaseline: number; // إجمالي – مشروع موبايلي (baseline + today's count)
  salamBaseline: number;
  mobilyBaseline: number;
}

/**
 * Real-time hook for statistics with daily reset support
 * At 00:30 each day, counters reset visually but continue from previous day's final total
 *
 * Example:
 * - Day 1 ends with salamTotal = 5, mobilyTotal = 1
 * - Day 2 (after 00:30): counters start from 5 and 1, not from zero
 * - If Day 2 gets 3 more salam entries, salamTotalWithBaseline = 5 + 3 = 8
 */
export function useRealtimeStats(initialStats: Stats) {
  const [stats, setStats] = useState<Stats>({
    ...initialStats,
    salamTotalWithBaseline: initialStats.salamTotalWithBaseline || initialStats.salamDailyCount || 0,
    mobilyTotalWithBaseline: initialStats.mobilyTotalWithBaseline || initialStats.mobilyDailyCount || 0,
    salamBaseline: initialStats.salamBaseline || 0,
    mobilyBaseline: initialStats.mobilyBaseline || 0,
  });

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Function to fetch updated stats with baseline
    const fetchStats = async () => {
      try {
        // Fetch total counts (all-time)
        const [salamCountResult, mobilyCountResult] = await Promise.all([
          supabase.from('salam_customers').select('*', { count: 'exact', head: true }),
          supabase.from('mobily_customers').select('*', { count: 'exact', head: true }),
        ]);

        // Fetch daily counts (today only)
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

        // Fetch baselines from stats_daily_baseline table
        // The baseline represents the cumulative total up to and including the previous day
        const [salamBaselineResult, mobilyBaselineResult] = await Promise.all([
          supabase
            .from('stats_daily_baseline')
            .select('baseline_total')
            .eq('project', 'salam')
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('stats_daily_baseline')
            .select('baseline_total')
            .eq('project', 'mobily')
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const salamBaseline = salamBaselineResult.data?.baseline_total || 0;
        const mobilyBaseline = mobilyBaselineResult.data?.baseline_total || 0;
        const salamDailyCount = salamDailyResult.count || 0;
        const mobilyDailyCount = mobilyDailyResult.count || 0;

        setStats({
          salamCount: salamCountResult.count || 0,
          mobilyCount: mobilyCountResult.count || 0,
          salamDailyCount,
          mobilyDailyCount,
          // The "إجمالي" cards show: baseline + today's count
          salamTotalWithBaseline: salamBaseline + salamDailyCount,
          mobilyTotalWithBaseline: mobilyBaseline + mobilyDailyCount,
          salamBaseline,
          mobilyBaseline,
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

    // Subscribe to baseline changes (in case cron runs while user is viewing)
    const baselineChannel = supabase
      .channel('baseline_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stats_daily_baseline',
        },
        () => {
          console.log('Stats baseline changed, updating stats...');
          fetchStats();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Unsubscribing from stats channels');
      supabase.removeChannel(salamChannel);
      supabase.removeChannel(mobilyChannel);
      supabase.removeChannel(baselineChannel);
    };
  }, []); // Empty dependency array - only setup once

  return stats;
}
