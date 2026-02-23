import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { getSessionHeaders } from "@/lib/session";

export function useTerminalExecute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, command }: { projectId: number; command: string }) => {
      const url = buildUrl(api.terminal.execute.path, { projectId });
      const res = await fetch(url, {
        method: api.terminal.execute.method,
        headers: {
          "Content-Type": "application/json",
          ...getSessionHeaders(),
        },
        body: JSON.stringify({ command }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Command execution failed");
      return api.terminal.execute.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.terminal.history.path, variables.projectId],
      });
    },
  });
}

export function useTerminalHistory(projectId: number | null) {
  return useQuery({
    queryKey: [api.terminal.history.path, projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const url = buildUrl(api.terminal.history.path, { projectId });
      const res = await fetch(url, {
        headers: getSessionHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch history");
      return api.terminal.history.responses[200].parse(await res.json());
    },
    enabled: !!projectId,
  });
}
