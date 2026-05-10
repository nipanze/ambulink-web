import AuthenticatedLayout from '@/components/shared/AuthenticatedLayout'

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
