import { SignUpForm } from "@/components/auth/sign-up";

export const metadata = {
  title: 'Sign Up - LEAD Talent Platform',
  description: 'Create your LEAD Talent Platform account.',
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
