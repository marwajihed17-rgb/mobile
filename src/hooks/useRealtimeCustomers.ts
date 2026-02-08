'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { scrollToTop } from '@/utils/scroll';
import type { SalamCustomer, MobilyCustomer } from '@/types/database';

/**
 * Helper: check if a Salam entry is fully confirmed (final stage - admin only)
 */
function isSalamEntryFullyConfirmed(customer: SalamCustomer): boolean {
  return customer.activation_status === 'confirmed';
}

/**
 * Helper: check if a Mobily entry is fully confirmed (final stage - admin only)
 */
function isMobilyEntryFullyConfirmed(customer: MobilyCustomer): boolean {
  return customer.activation_status === 'confirmed';
}

/**
 * 3-stage workflow filtering:
 * Stage 1: User submits, sets جاري التفعيل → visible to user + operator
 * Stage 2: Operator confirms تم التفعيل → status='activated', still visible to user + operator (with checkmark)
 * Stage 3: User final confirms → status='confirmed', removed from user + operator, only admin sees it
 *
 * Admin: only see 'confirmed' entries (archived/completed)
 * Operator: see 'activating' + 'activated' entries from all users (not null, not confirmed)
 * User: see own entries where status is NOT 'confirmed'
 */

export function useRealtimeSalamCustomers<T extends SalamCustomer>(initialData: T[], userId?: string, isAdmin?: boolean, isOperator?: boolean, operatorProfileId?: string) {
  const filteredInitialData = isAdmin
    ? initialData.filter(customer => customer.activation_status === 'confirmed')
    : isOperator
      ? initialData.filter(customer =>
          customer.activation_status === 'activating' || customer.activation_status === 'activated'
        )
      : initialData.filter(customer => !isSalamEntryFullyConfirmed(customer));

  const [customers, setCustomers] = useState<T[]>(filteredInitialData);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('salam_customers')
        .select('*, profiles(username, full_name, email, supervisor_name)')
        .order('created_at', { ascending: false });

      // Operators see all entries with activating/activated status; regular users see only their own
      if (!isAdmin && !isOperator && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching salam customers:', error);
        return;
      }

      if (data) {
        const filteredData = isAdmin
          ? data.filter(customer => (customer as SalamCustomer).activation_status === 'confirmed')
          : isOperator
            ? data.filter(customer => {
                const status = (customer as SalamCustomer).activation_status;
                return status === 'activating' || status === 'activated';
              })
            : data.filter(customer => !isSalamEntryFullyConfirmed(customer as SalamCustomer));
        setCustomers(filteredData as T[]);
      }
    } catch (err) {
      console.error('Error fetching salam customers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAdmin, isOperator, operatorProfileId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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
            fetchCustomers();
          } else if (payload.eventType === 'UPDATE') {
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
  }, [userId, isAdmin, isOperator, fetchCustomers]);

  return { customers, isConnected, isLoading, refetch: fetchCustomers };
}

export function useRealtimeMobilyCustomers<T extends MobilyCustomer>(initialData: T[], userId?: string, isAdmin?: boolean, isOperator?: boolean, operatorProfileId?: string) {
  const filteredInitialData = isAdmin
    ? initialData.filter(customer => customer.activation_status === 'confirmed')
    : isOperator
      ? initialData.filter(customer =>
          customer.activation_status === 'activating' || customer.activation_status === 'activated'
        )
      : initialData.filter(customer => !isMobilyEntryFullyConfirmed(customer));

  const [customers, setCustomers] = useState<T[]>(filteredInitialData);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('mobily_customers')
        .select('*, profiles(username, full_name, email, supervisor_name)')
        .order('created_at', { ascending: false });

      // Operators see all entries with activating/activated status; regular users see only their own
      if (!isAdmin && !isOperator && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching mobily customers:', error);
        return;
      }

      if (data) {
        const filteredData = isAdmin
          ? data.filter(customer => (customer as MobilyCustomer).activation_status === 'confirmed')
          : isOperator
            ? data.filter(customer => {
                const status = (customer as MobilyCustomer).activation_status;
                return status === 'activating' || status === 'activated';
              })
            : data.filter(customer => !isMobilyEntryFullyConfirmed(customer as MobilyCustomer));
        setCustomers(filteredData as T[]);
      }
    } catch (err) {
      console.error('Error fetching mobily customers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAdmin, isOperator, operatorProfileId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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
            fetchCustomers();
          } else if (payload.eventType === 'UPDATE') {
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
  }, [userId, isAdmin, isOperator, fetchCustomers]);

  return { customers, isConnected, isLoading, refetch: fetchCustomers };
}
