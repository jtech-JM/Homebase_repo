"use client";
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import TenantList from '@/components/landlord/TenantList';
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';
import { landlordSidebarItems } from '../page';

export default function TenantsPage() {
  return (
    <RoleProtectedLayout allowedRoles={['landlord']}>
      <DashboardLayout sidebarItems={landlordSidebarItems}>
        <div className="p-6">
          <TenantList />
        </div>
      </DashboardLayout>
    </RoleProtectedLayout>
  );
}
