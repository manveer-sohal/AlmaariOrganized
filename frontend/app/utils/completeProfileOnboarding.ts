import { clearAuthTokenCache, getAuthHeaders } from "./getAuthHeaders";

export type ProfileOnboardingPayload = {
  stylePreferences: string[];
  seasonalColorPalette: string;
  favoriteBrands: string[];
};

export async function completeProfileOnboarding(
  payload: ProfileOnboardingPayload,
) {
  const request = async () =>
    fetch("/api/users/complete-profile-onboarding", {
      method: "POST",
      headers: await getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });

  let response = await request();
  if (response.status === 401) {
    clearAuthTokenCache();
    response = await request();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        "Failed to save onboarding preferences",
    );
  }

  return response.json();
}
