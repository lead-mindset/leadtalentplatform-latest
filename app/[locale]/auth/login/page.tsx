import { LoginForm } from "@/components/auth/login";
import { getAuthMetadata } from "../_metadata";

export function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  return getAuthMetadata(params, 'login')
}

export default function Page() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  );
}
