import AuthenticatedLayout from '@/components/shared/AuthenticatedLayout'

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
