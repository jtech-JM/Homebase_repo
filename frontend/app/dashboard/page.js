"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const dashboardTitles = {
  admin: "Admin Dashboard",
  agent: "Agent Dashboard",
  student: "Student Dashboard",
  landlord: "Landlord Dashboard",
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle login + role redirection
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    // Debug: Log current session
    console.log("Dashboard - Current session:", session);
    console.log("Dashboard - User role:", session.user?.role);

    if (session.user?.role === "pending") {
      console.log("Dashboard - Role is still pending, redirecting to select_role");
      router.push("/select_role");
      return;
    }

    const userRole = session.user?.role;
    switch (userRole) {
      case "admin":
        router.push("/dashboard/admin");
        break;
      case "agent":
        router.push("/dashboard/agent");
        break;
      case "student":
        router.push("/dashboard/student");
        break;
      case "landlord":
        router.push("/dashboard/landlord");
        break;
      default:
        router.push("/login");
    }
  }, [session, status, router]);

  // Handle verification
 /* useEffect(() => {
    if (status !== "loading" && session && session.user?.verification_status !== "approved") {
      router.push("/verification");
    }
  }, [session, status, router]);
*/
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const role = session.user?.role;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">
        {dashboardTitles[role] || "Dashboard"}
      </h1>
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          Please wait while we redirect you to your dashboard...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </main>
  );
}
