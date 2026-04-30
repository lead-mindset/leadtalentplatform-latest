import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'FAQ - LEAD',
  description: 'Frequently asked questions about LEAD Talent Platform',
}

export default function FAQPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Find answers to common questions about LEAD and how we can help you succeed in tech.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">General</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What is LEAD?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  LEAD (Leadership, Education, and Development) is a talent platform that connects 
                  students with opportunities in the technology industry. We provide educational 
                  resources, networking events, mentorship, and direct access to job opportunities 
                  from our partner companies.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Who can join LEAD?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  LEAD is open to all students interested in pursuing a career in technology. 
                  Whether you&apos;re just starting your journey or already have experience, we have 
                  programs and resources tailored to your needs.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How much does it cost to join?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  LEAD membership is completely free for students. We believe that financial 
                  barriers should not prevent anyone from accessing quality tech education and 
                  opportunities.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Where are LEAD chapters located?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  LEAD has chapters at universities across the country. Check our events page 
                  to see if there&apos;s a chapter near you, or contact us about starting a new chapter 
                  at your school.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Membership</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do I become a member?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Simply sign up on our platform and complete your profile. Once your profile 
                  is approved by your local chapter, you&apos;ll have full access to all LEAD 
                  resources and events.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What&apos;s the approval process?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  After you sign up and complete your profile, it will be reviewed by the chapter 
                  editors at your university. This typically takes 1-2 business days. You&apos;ll 
                  receive an email once your profile is approved.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What are the benefits of membership?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  As a LEAD member, you get access to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Exclusive workshops and events</li>
                  <li>One-on-one mentorship opportunities</li>
                  <li>Job and internship postings from partner companies</li>
                  <li>Resume reviews and career guidance</li>
                  <li>Networking with industry professionals</li>
                  <li>Leadership opportunities within chapters</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Events</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What types of events does LEAD host?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  LEAD hosts a variety of events including:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Technical workshops and skill-building sessions</li>
                  <li>Career development and networking events</li>
                  <li>Hackathons and coding competitions</li>
                  <li>Industry speaker series</li>
                  <li>Company information sessions and recruiting events</li>
                  <li>Social mixers and community building activities</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do I register for events?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Once you&apos;re an approved member, you can register for events through our platform. 
                  Some events may require an application or have limited capacity, so register early 
                  to secure your spot.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Are events virtual or in-person?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We offer both virtual and in-person events to accommodate different preferences 
                  and locations. Virtual events are accessible to all members regardless of location, 
                  while in-person events are hosted by local chapters.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Career & Opportunities</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How can LEAD help me find a job?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  LEAD connects you with job opportunities through:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Exclusive job postings from partner companies</li>
                  <li>Direct recruitment events and career fairs</li>
                  <li>Resume reviews and interview preparation</li>
                  <li>Mentorship from industry professionals</li>
                  <li>Networking opportunities with hiring managers</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can recruiters see my profile?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, you can choose to make your profile visible to recruiters from our partner 
                  companies. This increases your chances of being discovered for opportunities that 
                  match your skills and interests.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Are there internship opportunities?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely! Many of our partner companies offer internship opportunities exclusively 
                  to LEAD members. These internships provide valuable experience and can lead to 
                  full-time positions after graduation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Technical Support</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">I&apos;m having trouble with my profile. What should I do?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  If you&apos;re experiencing issues with your profile, first try refreshing the page 
                  and clearing your browser cache. If the problem persists, contact your local 
                  chapter leaders or reach out to our support team.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How does event check-in work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  For in-person events, you&apos;ll receive a QR code after registering. Simply show 
                  this QR code at the event entrance for quick check-in. Virtual events don&apos;t 
                  require check-in.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What browsers are supported?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  LEAD works best on modern browsers including Chrome, Firefox, Safari, and Edge. 
                  We recommend using the latest version of your preferred browser for the best experience.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Still Have Questions?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Can&apos;t find the answer you&apos;re looking for? Our team is here to help. Reach out to us 
            and we&apos;ll get back to you as soon as possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:support@leadtech.org" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              Contact Support
            </a>
            <Link href="/events" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              View Events
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
