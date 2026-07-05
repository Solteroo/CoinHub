import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetAdminOwner, getGetAdminOwnerQueryKey } from "@workspace/api-client-react";

export default function VIP() {
  const [, setLocation] = useLocation();
  const { data: owner } = useGetAdminOwner({ query: { queryKey: getGetAdminOwnerQueryKey(), staleTime: 10 * 60_000 } });

  useEffect(() => {
    if (owner?.id) {
      setLocation(`/dm/${owner.id}`, { replace: true });
    } else if (owner !== undefined) {
      setLocation("/profile", { replace: true });
    }
  }, [owner]);

  return null;
}
