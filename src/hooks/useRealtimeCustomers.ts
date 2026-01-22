'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { scrollToTop } from '@/utils/scroll';
import type { SalamCustomer, MobilyCustomer } from '@/types/database';

/**
 * Real-time hook for Salam customers
 * Automatically syncs with database changes (INSERT, UPDATE, DELETE)
 * Generic to support extended types with additional properties (like profiles)
 */
export function useRealtimeSalamCustomers<T extends SalamCustomer>(initialData: T[]) {
  const [customers, setCustomers] = useState<T[]>(initialData);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('salam_customers_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'salam_customers',
        },
        (payload) => {
          console.log('Salam customer change received:', payload);

          if (payload.eventType === 'INSERT') {
            // Add new customer to the list (without profiles as it's raw DB data)
            const newCustomer = payload.new as T;
            setCustomers((prev) => [newCustomer, ...prev]);
            // Scroll to top to show the new entry
            scrollToTop();
          } else if (payload.eventType === 'UPDATE') {
            // Update existing customer
            const updatedCustomer = payload.new as T;
            setCustomers((prev) =>
              prev.map((customer) =>
                customer.id === updatedCustomer.id ? updatedCustomer : customer
              )
            );
            // Scroll to top to show the updated entry
            scrollToTop();
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted customer
            const deletedCustomer = payload.old as T;
            setCustomers((prev) =>
              prev.filter((customer) => customer.id !== deletedCustomer.id)
            );
            // Scroll to top to show the updated list
            scrollToTop();
          }
        }
      )
      .subscribe((status) => {
        console.log('Salam customers subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Unsubscribing from salam_customers');
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array - only setup once

  return { customers, isConnected };
}

/**
 * Real-time hook for Mobily customers
 * Automatically syncs with database changes (INSERT, UPDATE, DELETE)
 * Generic to support extended types with additional properties (like profiles)
 */
export function useRealtimeMobilyCustomers<T extends MobilyCustomer>(initialData: T[]) {
  const [customers, setCustomers] = useState<T[]>(initialData);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('mobily_customers_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'mobily_customers',
        },
        (payload) => {
          console.log('Mobily customer change received:', payload);

          if (payload.eventType === 'INSERT') {
            // Add new customer to the list (without profiles as it's raw DB data)
            const newCustomer = payload.new as T;
            setCustomers((prev) => [newCustomer, ...prev]);
            // Scroll to top to show the new entry
            scrollToTop();
          } else if (payload.eventType === 'UPDATE') {
            // Update existing customer
            const updatedCustomer = payload.new as T;
            setCustomers((prev) =>
              prev.map((customer) =>
                customer.id === updatedCustomer.id ? updatedCustomer : customer
              )
            );
            // Scroll to top to show the updated entry
            scrollToTop();
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted customer
            const deletedCustomer = payload.old as T;
            setCustomers((prev) =>
              prev.filter((customer) => customer.id !== deletedCustomer.id)
            );
            // Scroll to top to show the updated list
            scrollToTop();
          }
        }
      )
      .subscribe((status) => {
        console.log('Mobily customers subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Unsubscribing from mobily_customers');
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array - only setup once

  return { customers, isConnected };
}
