"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StudentLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard/student");
      return;
    }

    // Redirect if authenticated but not a student
    if (status === "authenticated" && session?.user) {
      const userRole = session.user.role;

      if (userRole === "pending") {
        router.push("/select_role");
        return;
      }

      if (userRole !== "student") {
        // Redirect to their appropriate dashboard
        router.push(`/dashboard/${userRole}`);
        return;
      }
    }
  }, [status, session, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated or not a student
  if (status === "unauthenticated" || session?.user?.role !== "student") {
    return null;
  }

  // Render children only if authenticated and is a student
  return <>{children}</>;
}
