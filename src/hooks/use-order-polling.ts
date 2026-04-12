"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order } from "@/types/order";

export function useOrderPolling(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        setError("Failed to load order");
        return;
      }
      const data = await res.json();
      setOrder(data);
      setError(null);
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    const intervalId = setInterval(() => {
      // Stop polling if order is terminal
      if (
        order?.status === "completed" ||
        order?.status === "cancelled"
      ) {
        clearInterval(intervalId);
        return;
      }
      fetchOrder();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchOrder, order?.status]);

  return { order, error, loading };
}
