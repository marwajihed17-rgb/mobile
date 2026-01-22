'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { SalamCustomer, MobilyCustomer } from '@/types/database';

/**
 * Real-time hook for Salam customers
 * Automatically syncs with database changes (INSERT, UPDATE, DELETE)
 */
export function useRealtimeSalamCustomers(initialData: SalamCustomer[]) {
  const [customers, setCustomers] = useState<SalamCustomer[]>(initialData);
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
            // Add new customer to the list
            const newCustomer = payload.new as SalamCustomer;
            setCustomers((prev) => [newCustomer, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing customer
            const updatedCustomer = payload.new as SalamCustomer;
            setCustomers((prev) =>
              prev.map((customer) =>
                customer.id === updatedCustomer.id ? updatedCustomer : customer
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted customer
            const deletedCustomer = payload.old as SalamCustomer;
            setCustomers((prev) =>
              prev.filter((customer) => customer.id !== deletedCustomer.id)
            );
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
 */
export function useRealtimeMobilyCustomers(initialData: MobilyCustomer[]) {
  const [customers, setCustomers] = useState<MobilyCustomer[]>(initialData);
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
            // Add new customer to the list
            const newCustomer = payload.new as MobilyCustomer;
            setCustomers((prev) => [newCustomer, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing customer
            const updatedCustomer = payload.new as MobilyCustomer;
            setCustomers((prev) =>
              prev.map((customer) =>
                customer.id === updatedCustomer.id ? updatedCustomer : customer
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted customer
            const deletedCustomer = payload.old as MobilyCustomer;
            setCustomers((prev) =>
              prev.filter((customer) => customer.id !== deletedCustomer.id)
            );
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
