import AuthenticatedLayout from '@/components/shared/AuthenticatedLayout'

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
