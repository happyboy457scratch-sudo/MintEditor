import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getSessionHeaders } from "@/lib/session";

export function useUsage() {
  return useQuery({
    queryKey: [api.usage.check.path],
    queryFn: async () => {
      const res = await fetch(api.usage.check.path, {
        headers: getSessionHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch usage");
      return api.usage.check.responses[200].parse(await res.json());
    },
    refetchInterval: 60000, // Check every minute
  });
}

export function useTrackUsage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (minutes: number) => {
      const res = await fetch(api.usage.track.path, {
        method: api.usage.track.method,
        headers: {
          "Content-Type": "application/json",
          ...getSessionHeaders(),
        },
        body: JSON.stringify({ minutes }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to track usage");
      return api.usage.track.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.usage.check.path] });
    },
  });
}

export function useCredits() {
  return useQuery({
    queryKey: [api.credits.get.path],
    queryFn: async () => {
      const res = await fetch(api.credits.get.path, {
        headers: getSessionHeaders(),
        credentials: "include",
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch credits");
      return api.credits.get.responses[200].parse(await res.json());
    },
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: [api.subscription.get.path],
    queryFn: async () => {
      const res = await fetch(api.subscription.get.path, {
        headers: getSessionHeaders(),
        credentials: "include",
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch subscription");
      return api.subscription.get.responses[200].parse(await res.json());
    },
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (tier: "premium" | "premium_ultimate") => {
      const res = await fetch(api.subscription.create.path, {
        method: api.subscription.create.method,
        headers: {
          "Content-Type": "application/json",
          ...getSessionHeaders(),
        },
        body: JSON.stringify({ tier }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create checkout session");
      return api.subscription.create.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
  });
}
