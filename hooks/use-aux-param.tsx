"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useAuxParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setAuxParam = useCallback(
    (value: string | null) => {
      const currentParams = new URLSearchParams(searchParams.toString());

      if (value) {
        currentParams.set("aux", value);
      } else {
        currentParams.delete("aux");
      }

      const queryString = currentParams.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;

      router.push(nextUrl);
    },
    [pathname, router, searchParams],
  );

  return {
    auxParamValue: searchParams.get("aux"),
    setAuxParam,
  };
}