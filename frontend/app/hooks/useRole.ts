import { useUserData } from "./useUserData";

export const useRole = () => {
  const { user } = useUserData();
  return {
    role: user?.role,
    isLoadingRole: user?.isLoadingRole,
  };
};
