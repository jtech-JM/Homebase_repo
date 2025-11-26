"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/dashboard/admin");
      return;
    }

    if (status === "authenticated" && session?.user) {
      const role = session.user.role;

      if (role === "pending") {
        router.replace("/select_role");
        return;
      }

      if (role !== "admin") {
        router.replace(`/dashboard/${role}`);
        return;
      }
    }
  }, [status, session, router]);

  // Show spinner while loading or if unauthorized
  if (status === "loading" || !session || session.user.role !== "admin") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 bg-opacity-70 z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Render admin content
  return <>{children}</>;
}
