import AuthenticatedLayout from '@/components/shared/AuthenticatedLayout'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
