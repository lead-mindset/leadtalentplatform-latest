import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/herolead";
import Link from "next/link";
import { Suspense } from "react";
import NavHeader from "@/components/global/navigation/NavHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // added
import { Users, Building2, TrendingUp, Shield } from "lucide-react"; // added icons

export default function Home() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <NavHeader />
      </Suspense>
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-20 items-center">
          <div className="flex-1 items-center justify-center flex flex-col bg-red-500 max-w-5xl p-5">
            <div className="container mx-auto px-4 py-16 md:py-24">
              <div className="max-w-4xl mx-auto text-center mb-16">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-8 shadow-xl">
                  <span className="text-white font-bold text-4xl">L</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  Your Professional Profile,
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {" "}
                    Amplified
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Connect with top recruiters and companies across Peru. Build your talent profile and unlock real opportunities.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-6">
                    Create Your Profile
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
                    Learn More
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  ✓ Free forever · ✓ 2 minutes to set up · ✓ Full control over your data
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
                <Card className="border-2 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Professional Visibility</h3>
                    <p className="text-gray-600">
                      Showcase your skills, experience, and potential to recruiters from leading companies actively seeking talent.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                      <Building2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Direct Connections</h3>
                    <p className="text-gray-600">
                      Get discovered by partner companies and recruiters looking for students from your university and field of study.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Career Opportunities</h3>
                    <p className="text-gray-600">
                      Access internships, mentorship programs, and networking events designed to accelerate your professional growth.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="max-w-3xl mx-auto">
                <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2 text-gray-900">You're in Complete Control</h3>
                        <p className="text-gray-700 mb-3">
                          Your profile is only shared with recruiters when you explicitly opt in. You can update your preferences or opt out at any time.
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>✓ Secure Google authentication</li>
                          <li>✓ Your data is never sold or shared without permission</li>
                          <li>✓ Full transparency on who views your profile</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-16 text-center">
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">500+</div>
                  <div className="text-gray-600 text-sm md:text-base">Active Students</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-2">50+</div>
                  <div className="text-gray-600 text-sm md:text-base">Partner Companies</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">20+</div>
                  <div className="text-gray-600 text-sm md:text-base">Universities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
