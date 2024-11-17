"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/authcontext";

const useRequireAuth = () => {
  const { user, isInitialized } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        // 如果用户未登录，则重定向到登录页面
        router.push("/public/login");
      } else {
        // 如果用户已登录，则不需要重定向
        setIsLoading(false);
      }
    }
  }, [user, isInitialized, router]);

  return { user, isLoading };
};

export default useRequireAuth;
