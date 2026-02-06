'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { scrollToTop } from '@/utils/scroll';
import type { SalamCustomer, MobilyCustomer } from '@/types/database';

/**
 * Helper function to check if a Salam customer entry is complete
 * (has operator_id AND activation_status is 'activated')
 * Note: entries with 'activating' status are NOT complete and remain visible
 */
function isSalamEntryComplete(customer: SalamCustomer): boolean {
  return customer.operator_id !== null &&
         customer.operator_id !== undefined &&
         customer.activation_status === 'activated';
}

/**
 * Helper function to check if a Mobily customer entry is complete
 * (has operator_id AND activation_status is 'activated' AND price)
 * Note: entries with 'activating' status are NOT complete and remain visible
 */
function isMobilyEntryComplete(customer: MobilyCustomer): boolean {
  return customer.operator_id !== null &&
         customer.operator_id !== undefined &&
         customer.activation_status === 'activated' &&
         customer.price !== null &&
         customer.price !== undefined;
}

/**
 * Real-time hook for Salam customers
 * Fetches fresh data on mount and automatically syncs with database changes
 * Workflow: user submits → جاري التفعيل → تم التفعيل → admin sees it
 * - Admins: only see entries with activation_status === 'activated'
 * - Non-admins: hide completed entries (activated with operator set)
 */
export function useRealtimeSalamCustomers<T extends SalamCustomer>(initialData: T[], userId?: string, isAdmin?: boolean) {
  // Filter initial data based on role
  const filteredInitialData = isAdmin
    ? initialData.filter(customer => customer.activation_status === 'activated')
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
        // Admins: only show activated entries. Non-admins: hide completed entries
        const filteredData = isAdmin
          ? data.filter(customer => (customer as SalamCustomer).activation_status === 'activated')
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
 * Workflow: user submits → جاري التفعيل → تم التفعيل → admin sees it
 * - Admins: only see entries with activation_status === 'activated'
 * - Non-admins: hide completed entries (activated with operator and price set)
 */
export function useRealtimeMobilyCustomers<T extends MobilyCustomer>(initialData: T[], userId?: string, isAdmin?: boolean) {
  // Filter initial data based on role
  const filteredInitialData = isAdmin
    ? initialData.filter(customer => customer.activation_status === 'activated')
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
        // Admins: only show activated entries. Non-admins: hide completed entries
        const filteredData = isAdmin
          ? data.filter(customer => (customer as MobilyCustomer).activation_status === 'activated')
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
