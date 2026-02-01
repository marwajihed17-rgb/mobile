'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { scrollToTop } from '@/utils/scroll';
import type { SalamCustomer, MobilyCustomer } from '@/types/database';

/**
 * Helper function to check if a Salam customer entry is complete
 * (has operator_id AND activation_status)
 */
function isSalamEntryComplete(customer: SalamCustomer): boolean {
  return customer.operator_id !== null &&
         customer.operator_id !== undefined &&
         customer.activation_status !== null &&
         customer.activation_status !== undefined;
}

/**
 * Helper function to check if a Mobily customer entry is complete
 * (has operator_id AND activation_status AND price)
 */
function isMobilyEntryComplete(customer: MobilyCustomer): boolean {
  return customer.operator_id !== null &&
         customer.operator_id !== undefined &&
         customer.activation_status !== null &&
         customer.activation_status !== undefined &&
         customer.price !== null &&
         customer.price !== undefined;
}

/**
 * Real-time hook for Salam customers
 * Fetches fresh data on mount and automatically syncs with database changes
 * For non-admin users/operators: hides entries where operator_id AND activation_status are both set
 */
export function useRealtimeSalamCustomers<T extends SalamCustomer>(initialData: T[], userId?: string, isAdmin?: boolean) {
  // Filter initial data for non-admins to hide completed entries
  const filteredInitialData = isAdmin
    ? initialData
    : initialData.filter(customer => !isSalamEntryComplete(customer));

  const [customers, setCustomers] = useState<T[]>(filteredInitialData);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch fresh data from database
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      // Include profiles join to get supervisor_name for statistics
      let query = supabase
        .from('salam_customers')
        .select('*, profiles(username, full_name, email, supervisor_name)')
        .order('created_at', { ascending: false });

      // Filter by user if not admin
      if (!isAdmin && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching salam customers:', error);
        return;
      }

      if (data) {
        // For non-admin users/operators, filter out entries where operator_id AND activation_status are both set
        const filteredData = isAdmin
          ? data
          : data.filter(customer => !isSalamEntryComplete(customer as SalamCustomer));
        setCustomers(filteredData as T[]);
      }
    } catch (err) {
      console.error('Error fetching salam customers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAdmin]);

  // Fetch fresh data on mount and when initialData changes
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Subscribe to real-time changes
  useEffect(() => {
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel('salam_customers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'salam_customers',
        },
        (payload) => {
          console.log('Salam customer change received:', payload);

          if (payload.eventType === 'INSERT') {
            // Refetch to get the profile data with supervisor_name
            fetchCustomers();
          } else if (payload.eventType === 'UPDATE') {
            // Refetch to get the updated data with profile
            fetchCustomers();
          } else if (payload.eventType === 'DELETE') {
            const deletedCustomer = payload.old as T;
            setCustomers((prev) =>
              prev.filter((customer) => customer.id !== deletedCustomer.id)
            );
            scrollToTop();
          }
        }
      )
      .subscribe((status) => {
        console.log('Salam customers subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('Unsubscribing from salam_customers');
      supabase.removeChannel(channel);
    };
  }, [userId, isAdmin, fetchCustomers]);

  return { customers, isConnected, isLoading, refetch: fetchCustomers };
}

/**
 * Real-time hook for Mobily customers
 * Fetches fresh data on mount and automatically syncs with database changes
 * For non-admin users/operators: hides entries where operator_id AND activation_status AND price are all set
 */
export function useRealtimeMobilyCustomers<T extends MobilyCustomer>(initialData: T[], userId?: string, isAdmin?: boolean) {
  // Filter initial data for non-admins to hide completed entries
  const filteredInitialData = isAdmin
    ? initialData
    : initialData.filter(customer => !isMobilyEntryComplete(customer));

  const [customers, setCustomers] = useState<T[]>(filteredInitialData);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch fresh data from database
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      // Include profiles join to get supervisor_name for statistics
      let query = supabase
        .from('mobily_customers')
        .select('*, profiles(username, full_name, email, supervisor_name)')
        .order('created_at', { ascending: false });

      // Filter by user if not admin
      if (!isAdmin && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching mobily customers:', error);
        return;
      }

      if (data) {
        // For non-admin users/operators, filter out entries where operator_id AND activation_status AND price are all set
        const filteredData = isAdmin
          ? data
          : data.filter(customer => !isMobilyEntryComplete(customer as MobilyCustomer));
        setCustomers(filteredData as T[]);
      }
    } catch (err) {
      console.error('Error fetching mobily customers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAdmin]);

  // Fetch fresh data on mount and when initialData changes
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Subscribe to real-time changes
  useEffect(() => {
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel('mobily_customers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mobily_customers',
        },
        (payload) => {
          console.log('Mobily customer change received:', payload);

          if (payload.eventType === 'INSERT') {
            // Refetch to get the profile data with supervisor_name
            fetchCustomers();
          } else if (payload.eventType === 'UPDATE') {
            // Refetch to get the updated data with profile
            fetchCustomers();
          } else if (payload.eventType === 'DELETE') {
            const deletedCustomer = payload.old as T;
            setCustomers((prev) =>
              prev.filter((customer) => customer.id !== deletedCustomer.id)
            );
            scrollToTop();
          }
        }
      )
      .subscribe((status) => {
        console.log('Mobily customers subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('Unsubscribing from mobily_customers');
      supabase.removeChannel(channel);
    };
  }, [userId, isAdmin, fetchCustomers]);

  return { customers, isConnected, isLoading, refetch: fetchCustomers };
}
