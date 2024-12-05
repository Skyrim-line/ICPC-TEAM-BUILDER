"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const RedirectToHome = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /public/home
    router.push("/public/home");
  }, [router]);

  return <div>Redirecting to home...</div>;
};

export default RedirectToHome;
