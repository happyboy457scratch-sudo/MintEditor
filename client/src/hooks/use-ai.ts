import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getSessionHeaders } from "@/lib/session";

export function useAIFixCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { code: string; language: string; error?: string }) => {
      const res = await fetch(api.ai.fixCode.path, {
        method: api.ai.fixCode.method,
        headers: {
          "Content-Type": "application/json",
          ...getSessionHeaders(),
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (res.status === 403) throw new Error("Out of credits or unauthorized");
      if (!res.ok) throw new Error("AI request failed");
      return api.ai.fixCode.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.usage.check.path] }),
  });
}

export function useAIExplainError() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { code: string; language: string; error: string }) => {
      const res = await fetch(api.ai.explainError.path, {
        method: api.ai.explainError.method,
        headers: {
          "Content-Type": "application/json",
          ...getSessionHeaders(),
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (res.status === 403) throw new Error("Out of credits or unauthorized");
      if (!res.ok) throw new Error("AI request failed");
      return api.ai.explainError.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.usage.check.path] }),
  });
}

export function useAIImproveCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { code: string; language: string }) => {
      const res = await fetch(api.ai.improveCode.path, {
        method: api.ai.improveCode.method,
        headers: {
          "Content-Type": "application/json",
          ...getSessionHeaders(),
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (res.status === 403) throw new Error("Out of credits or unauthorized");
      if (!res.ok) throw new Error("AI request failed");
      return api.ai.improveCode.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.usage.check.path] }),
  });
}

export function useAIGenerateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { prompt: string; language: string }) => {
      const res = await fetch(api.ai.generateProgram.path, {
        method: api.ai.generateProgram.method,
        headers: {
          "Content-Type": "application/json",
          ...getSessionHeaders(),
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "AI request failed");
      }
      return api.ai.generateProgram.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.usage.check.path] }),
  });
}
