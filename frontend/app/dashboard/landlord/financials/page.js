"use client";
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import FinancialDashboard from '@/components/landlord/FinancialDashboard';
import { landlordSidebarItems } from '../page';

export default function FinancialsPage() {
  return (
    <DashboardLayout sidebarItems={landlordSidebarItems}>
      <div className="p-6">
        <FinancialDashboard />
      </div>
    </DashboardLayout>
  );
}