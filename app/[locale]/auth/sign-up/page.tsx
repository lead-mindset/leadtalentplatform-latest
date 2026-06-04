import { SignUpForm } from "@/components/auth/sign-up";
import { getAuthMetadata } from "../_metadata";

export function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  return getAuthMetadata(params, 'signUp')
}

export default function Page() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </main>
  );
}
