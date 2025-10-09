"use client";
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MaintenanceRequests from '@/components/landlord/MaintenanceRequests';
import { landlordSidebarItems } from '../page';

export default function MaintenancePage() {
  return (
    <DashboardLayout sidebarItems={landlordSidebarItems}>
      <div className="p-6">
        <MaintenanceRequests />
      </div>
    </DashboardLayout>
  );
}