"use client";
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import TenantList from '@/components/landlord/TenantList';
import { landlordSidebarItems } from '../page';

export default function TenantsPage() {
  return (
    <DashboardLayout sidebarItems={landlordSidebarItems}>
      <div className="p-6">
        <TenantList />
      </div>
    </DashboardLayout>
  );
}