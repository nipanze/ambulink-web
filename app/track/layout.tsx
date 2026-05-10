import AuthenticatedLayout from '@/components/shared/AuthenticatedLayout'

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
