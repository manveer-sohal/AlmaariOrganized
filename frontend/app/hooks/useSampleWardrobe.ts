"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@auth0/nextjs-auth0/client";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";

async function postClothesAction(path: string) {
  const run = async () =>
    fetch(`/api/clothes/${path}`, {
      method: "POST",
      headers: await getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({}),
    });

  let response = await run();
  if (response.status === 401) {
    clearAuthTokenCache();
    response = await run();
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return response.json();
}

export function useSampleWardrobe() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["clothesData"] });
    if (user?.sub) {
      await queryClient.invalidateQueries({ queryKey: ["user", user.sub] });
    }
  };

  const seedSamples = useMutation({
    mutationFn: () => postClothesAction("seedSamples"),
    onSuccess: invalidate,
  });

  const clearSamples = useMutation({
    mutationFn: () => postClothesAction("clearSamples"),
    onSuccess: invalidate,
  });

  return { seedSamples, clearSamples };
}
