import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@auth0/nextjs-auth0/client";
import { CreditPackageId } from "../data/creditPackages";

type PurchaseCreditsResponse = {
  success: boolean;
  message?: string;
  creditsAdded?: number;
  creditBalance?: number;
  packageId?: string;
};

export const usePurchaseCredits = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageId: CreditPackageId) => {
      if (!user?.sub) {
        throw new Error("You must be logged in to purchase credits.");
      }

      const response = await fetch("/api/users/purchase-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth0Id: user.sub,
          packageId,
        }),
      });

      const data: PurchaseCreditsResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to purchase credits");
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.creditBalance != null && user?.sub) {
        queryClient.setQueryData(["user", user.sub], (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          return {
            ...old,
            creditBalance: data.creditBalance,
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ["user", user?.sub] });
    },
  });
};
