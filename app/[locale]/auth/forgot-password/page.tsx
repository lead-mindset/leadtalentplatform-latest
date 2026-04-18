import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata = {
  title: 'Forgot Password - LEAD Talent Platform',
  description: 'Reset your LEAD Talent Platform account password.',
}

export default function Page() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
