import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const RealtimeContext = createContext(null);

const STREAM_URL = import.meta.env.VITE_REALTIME_STREAM_URL || '/api/realtime/stream';

export const RealtimeProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const listenersRef = useRef(new Map());

  // Broadcast event to listeners
  const emitEvent = (eventData) => {
    setLastEvent(eventData);
    setRecentEvents((prev) => [eventData, ...prev].slice(0, 20));

    const callbacks = listenersRef.current.get(eventData.eventType) || [];
    callbacks.forEach((cb) => cb(eventData));

    const wildcards = listenersRef.current.get('*') || [];
    wildcards.forEach((cb) => cb(eventData));
  };

  useEffect(() => {
    // 1. Supabase Postgres Realtime Channels
    let supabaseChannel = null;
    if (isSupabaseConfigured()) {
      try {
        supabaseChannel = supabase
          .channel('hiresphere-live-feed')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'applications' },
            (payload) => {
              console.log('⚡ Supabase Realtime Applications event:', payload);
              const eventType = payload.eventType === 'INSERT'
                ? 'APPLICATION_CREATED'
                : payload.eventType === 'UPDATE'
                ? 'APPLICATION_STATUS_UPDATED'
                : 'APPLICATION_DELETED';

              emitEvent({
                eventType,
                data: payload.new || payload.old,
                timestamp: new Date().toISOString(),
                source: 'SUPABASE_REALTIME',
              });
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'jobs' },
            (payload) => {
              console.log('⚡ Supabase Realtime Jobs event:', payload);
              const eventType = payload.eventType === 'INSERT'
                ? 'JOB_CREATED'
                : payload.eventType === 'UPDATE'
                ? 'JOB_UPDATED'
                : 'JOB_DELETED';

              emitEvent({
                eventType,
                data: payload.new || payload.old,
                timestamp: new Date().toISOString(),
                source: 'SUPABASE_REALTIME',
              });
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'interviews' },
            (payload) => {
              emitEvent({
                eventType: 'INTERVIEW_UPDATED',
                data: payload.new || payload.old,
                timestamp: new Date().toISOString(),
                source: 'SUPABASE_REALTIME',
              });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
            }
          });
      } catch (sbErr) {
        console.warn('Supabase realtime channel error:', sbErr);
      }
    }

    // 2. SSE Fallback Stream
    let eventSource = null;
    let reconnectTimeout = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource(STREAM_URL);

        eventSource.addEventListener('hire-sphere-realtime', (e) => {
          try {
            const data = JSON.parse(e.data);
            emitEvent(data);
          } catch (err) {
            console.error('Error parsing SSE event:', err);
          }
        });

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onerror = () => {
          if (!isSupabaseConfigured()) {
            setIsConnected(false);
          }
          eventSource.close();
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        if (!isSupabaseConfigured()) {
          setIsConnected(false);
        }
        reconnectTimeout = setTimeout(connectSSE, 5000);
      }
    };

    connectSSE();

    return () => {
      if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const addEventListener = (eventType, callback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, []);
    }
    listenersRef.current.get(eventType).push(callback);

    // Return cleanup unsubscribe function
    return () => {
      const list = listenersRef.current.get(eventType) || [];
      listenersRef.current.set(eventType, list.filter((cb) => cb !== callback));
    };
  };

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        lastEvent,
        recentEvents,
        addEventListener,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
