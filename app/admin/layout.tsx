import AuthenticatedLayout from '@/components/shared/AuthenticatedLayout'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
