import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/herolead";
import Link from "next/link";
import { Suspense } from "react";
import NavHeader from "@/components/global/navigation/NavHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, TrendingUp, Shield } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <NavHeader />
      </Suspense>

      <main className="min-h-screen flex flex-col items-center bg-background text-foreground">
        <div className="flex-1 w-full flex flex-col gap-20 items-center">
          <div className="flex-1 items-center justify-center flex flex-col max-w-5xl p-5">
            <div className="container mx-auto px-4 py-16 md:py-24">
              <div className="max-w-4xl mx-auto text-center mb-16">
                {/* Logo */}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-8 shadow-xl overflow-hidden">
                  <Image
                    src="/leadl2.svg"
                    alt="Logo"
                    width={256}      // 24 * 4 = 96px
                    height={256}     // same as width
                    className="object-cover"
                  />
                </div>

                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                  Your Professional Profile,
                  <span className="bg-clip-text text-transparent bg-linear-to-r from-chart-1 to-chart-3">
                    {" "}Amplified
                  </span>
                </h1>

                {/* Subheadline */}
                <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-muted-foreground">
                  Connect with top recruiters and companies across Peru. Build your talent profile and unlock real opportunities.
                </p>


                <p className="text-sm text-muted-foreground">
                  ✓ Free forever · ✓ 2 minutes to set up · ✓ Full control over your data
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
                <Card className="border-2 hover:shadow-lg transition-shadow bg-card text-card-foreground">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-chart-1">
                      <Users className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Professional Visibility</h3>
                    <p className="text-muted-foreground">
                      Showcase your skills, experience, and potential to recruiters from leading companies actively seeking talent.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-shadow bg-card text-card-foreground">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-chart-2">
                      <Building2 className="w-6 h-6 text-secondary-foreground" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Direct Connections</h3>
                    <p className="text-muted-foreground">
                      Get discovered by partner companies and recruiters looking for students from your university and field of study.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-shadow bg-card text-card-foreground">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-chart-3">
                      <TrendingUp className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Career Opportunities</h3>
                    <p className="text-muted-foreground">
                      Access internships, mentorship programs, and networking events designed to accelerate your professional growth.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Trust & Privacy */}
              <div className="max-w-3xl mx-auto">
                <Card className="border-2 bg-card text-card-foreground">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-background">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2">You're in Complete Control</h3>
                        <p className="mb-3 text-muted-foreground">
                          Your profile is only shared with recruiters when you explicitly opt in. You can update your preferences or opt out at any time.
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>✓ Secure Google authentication</li>
                          <li>✓ Your data is never sold or shared without permission</li>
                          <li>✓ Full transparency on who views your profile</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>


            </div>
          </div>
        </div>
      </main>
    </>
  );
}
