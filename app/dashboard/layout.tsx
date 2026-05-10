import AuthenticatedLayout from '@/components/shared/AuthenticatedLayout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
