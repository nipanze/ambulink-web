import AuthenticatedLayout from '@/components/shared/AuthenticatedLayout'

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
