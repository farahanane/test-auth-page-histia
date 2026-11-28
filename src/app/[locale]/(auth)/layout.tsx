import { AuthShell } from "@/features/auth/components/auth-shell";

// The company cards (step 7) will be passed as `background`.
export default function AuthLayout({ children }: LayoutProps<"/[locale]">) {
  return <AuthShell logoLabel="Stolos">{children}</AuthShell>;
}
