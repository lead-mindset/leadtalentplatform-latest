import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MainContainer } from '@/components/global/main-container'

export const metadata: Metadata = {
  title: 'About LEAD',
  description: 'Learn about LEAD Talent Platform and our mission',
}

export default function AboutPage() {
  return (
    <MainContainer maxWidth="4xl" className="py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="fluid-h1 mb-6">
          About LEAD
        </h1>
        <p className="fluid-body text-muted-foreground max-w-3xl leading-relaxed">
          Empowering the next generation of tech talent through community, education, and opportunity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="fluid-h2">
            Our Mission
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            LEAD (Leadership, Education, and Development) is dedicated to bridging the gap between 
            talented students and opportunities in the technology industry. We believe that every 
            deserving student should have access to the resources, mentorship, and connections 
            needed to succeed in their tech career.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Student Members</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Partner Companies</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">100+</div>
              <div className="text-sm text-muted-foreground">Events Annually</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="fluid-h2 text-center">
          Our Values
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Community First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We build inclusive communities where students can collaborate, learn together, 
                and support each other's growth.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Excellence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We strive for excellence in everything we do, from our educational programs 
                to the opportunities we connect students with.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Accessibility</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We believe tech opportunities should be accessible to all students, regardless 
                of their background or circumstances.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Innovation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We embrace innovation and prepare students for the future of technology 
                through cutting-edge programs and partnerships.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="fluid-h2 text-center">
          What We Offer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Technical Workshops</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Hands-on workshops covering the latest technologies and industry best practices.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Career Development</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Resume reviews, interview prep, and career guidance from industry professionals.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Networking Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Connect with peers, mentors, and industry leaders at our regular networking events.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hackathons</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Competitive and collaborative hackathons to build real-world skills and portfolios.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mentorship</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                One-on-one mentorship with experienced professionals in your field of interest.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Exclusive access to internships and full-time positions from our partner companies.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-8 text-center">
          <h3 className="fluid-h3 mb-4">
            Join Our Community
          </h3>
          <p className="fluid-body text-muted-foreground mb-6 max-w-2xl mx-auto">
            Ready to take the next step in your tech journey? Join thousands of students who are 
            already part of the LEAD movement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="px-6 py-2 text-base">
              <Link href="/auth/sign-up">Sign Up Today</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-6 py-2 text-base">
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </MainContainer>
  )
}
