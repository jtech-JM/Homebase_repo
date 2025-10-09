"use client";
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DocumentManager from '@/components/landlord/DocumentManager';
import { landlordSidebarItems } from '../page';

export default function DocumentsPage() {
  return (
    <DashboardLayout sidebarItems={landlordSidebarItems}>
      <div className="p-6">
        <DocumentManager />
      </div>
    </DashboardLayout>
  );
}