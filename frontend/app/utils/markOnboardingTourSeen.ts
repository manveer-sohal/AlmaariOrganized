import { clearAuthTokenCache, getAuthHeaders } from "./getAuthHeaders";

export async function markOnboardingTourSeen(): Promise<string | null> {
  const request = async () =>
    fetch("/api/users/onboarding-tour-seen", {
      method: "PATCH",
      headers: await getAuthHeaders(),
    });

  let response = await request();
  if (response.status === 401) {
    clearAuthTokenCache();
    response = await request();
  }

  if (!response.ok) {
    throw new Error("Failed to mark onboarding tour as seen");
  }

  const data = (await response.json()) as { onboardingTourSeenAt?: string };
  return data.onboardingTourSeenAt ?? null;
}
