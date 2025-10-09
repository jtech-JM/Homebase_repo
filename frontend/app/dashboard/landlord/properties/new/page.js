"use client";
import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PropertyForm from '@/components/landlord/PropertyForm';
import { landlordSidebarItems } from '../page';

export default function NewPropertyPage() {
  return (
    <DashboardLayout sidebarItems={landlordSidebarItems}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Add New Property</h1>
        <PropertyForm />
      </div>
    </DashboardLayout>
  );
}