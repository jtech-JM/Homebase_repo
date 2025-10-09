"use client";
import React, { Suspense } from "react";
import ResetPasswordForm from "../../components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <ResetPasswordForm />
      </main>
    </Suspense>
  );
}
