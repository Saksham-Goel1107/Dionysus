import { Metadata } from 'next';
import { Scale } from 'lucide-react';

import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GradientHeader, ContentContainer, StickyTabsHeader } from '@/components/ui/content-layout';
import { CardWithGradient } from '@/components/ui/card-with-gradient';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '../components/navbar';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Dionysus',
  description: 'Terms and conditions for using Dionysus',
};

export default function TermsPage() {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <div className="min-h-screen">
        <GradientHeader>
          <ContentContainer>
            <PageHeader
              icon={<Scale className="h-6 w-6" />}
              title="Terms & Conditions"
              description="Last updated: June 20, 2025"
            />
          </ContentContainer>
        </GradientHeader>

        <ContentContainer>
          <Tabs defaultValue="terms" className="space-y-8">
            <StickyTabsHeader>
              <TabsList>
                <TabsTrigger value="terms">General Terms</TabsTrigger>
                <TabsTrigger value="license">License</TabsTrigger>
                <TabsTrigger value="restrictions">Usage Restrictions</TabsTrigger>
                <TabsTrigger value="liability">Liability</TabsTrigger>
              </TabsList>
            </StickyTabsHeader>

            <TabsContent value="terms" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <CardWithGradient gradient="violet">
                  <CardHeader>
                    <CardTitle>Agreement Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      By using Dionysus, you agree to these terms in full. If you disagree with
                      these terms or any part of these terms, you must not use this service.
                    </p>
                  </CardContent>
                </CardWithGradient>

                <CardWithGradient gradient="blue">
                  <CardHeader>
                    <CardTitle>Service Access</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      We reserve the right to restrict access to areas of our service, or indeed our
                      whole service, at our discretion and without notice.
                    </p>
                  </CardContent>
                </CardWithGradient>

                <CardWithGradient gradient="emerald">
                  <CardHeader>
                    <CardTitle>Account Terms</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      You are responsible for maintaining the confidentiality of your account and
                      password and for restricting access to your account.
                    </p>
                  </CardContent>
                </CardWithGradient>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <h2>1. Terms of Service Agreement</h2>
                <p>
                  These Terms of Service (&quot;Terms&quot;) govern your access to and use of
                  Dionysus&apos;s services, including our website, AI features, and any other
                  software or services offered by us in connection with any of the foregoing
                  (&quot;Services&quot;).
                </p>

                <h3>1.1 Accepting these Terms</h3>
                <p>
                  By registering for an account or using any of our Services, you agree to be bound
                  by these Terms. If you don&apos;t agree to these Terms, do not use the Services.
                </p>

                <h3>1.2 Changes to these Terms</h3>
                <p>
                  We may modify the Terms at any time, at our sole discretion. If we do so,
                  we&apos;ll let you know either by posting the modified Terms on the Site or
                  through other communications. If you continue to use the Services after we&apos;ve
                  let you know about changes to the Terms, you&apos;re indicating that you agree to
                  the modified Terms.
                </p>

                <h2>2. Using our Services</h2>
                <p>
                  You must follow any policies made available to you within the Services. Don&apos;t
                  misuse our Services. For example, don&apos;t interfere with our Services or try to
                  access them using a method other than the interface and the instructions that we
                  provide.
                </p>

                <h3>2.1 Your Account</h3>
                <p>
                  To use many of the Services, you must register for an account. When you register
                  for an account, you must provide accurate and complete information. You are solely
                  responsible for the activity that occurs on your account, and you must keep your
                  account password secure.
                </p>

                <h3>2.2 Service Updates</h3>
                <p>
                  We are constantly updating and improving our Services. We may add, alter, or
                  remove functionality from a Service at any time without prior notice. We may also
                  limit, suspend, or discontinue a Service at our discretion. If we discontinue a
                  Service, where appropriate, we&apos;ll give you reasonable advance notice and a
                  chance to get your information out of the Service.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="license" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <CardWithGradient gradient="amber">
                  <CardHeader>
                    <CardTitle>Software License</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Limited, non-exclusive, non-transferable license to use Dionysus for your
                      internal business purposes.
                    </p>
                  </CardContent>
                </CardWithGradient>

                <CardWithGradient gradient="rose">
                  <CardHeader>
                    <CardTitle>Intellectual Property</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      All rights, title, and interest in and to the Services are and will remain the
                      exclusive property of Dionysus.
                    </p>
                  </CardContent>
                </CardWithGradient>

                <CardWithGradient gradient="violet">
                  <CardHeader>
                    <CardTitle>Usage Rights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Your right to use the service is subject to any limitations based on your
                      subscription plan.
                    </p>
                  </CardContent>
                </CardWithGradient>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <h2>3. License Terms</h2>
                <p>
                  Subject to these Terms, Dionysus grants you a limited, non-exclusive,
                  non-transferable license to use our Services solely for your internal business
                  purposes.
                </p>

                <h3>3.1 Intellectual Property Rights</h3>
                <p>
                  The Services and all rights therein are and shall remain Dionysus&apos;s property
                  or the property of our licensors. Neither these Terms nor your use of the Services
                  convey or grant to you any rights:
                </p>
                <ul>
                  <li>
                    in or related to the Services except for the limited license granted above; or
                  </li>
                  <li>
                    to use or reference in any manner Dionysus&apos;s company names, logos, product
                    and service names, trademarks, or services marks.
                  </li>
                </ul>

                <h3>3.2 Feedback</h3>
                <p>
                  If you provide feedback to us, we may use and share such feedback without
                  restriction or obligation to you, as long as we don&apos;t identify you as the
                  source of the feedback without your permission.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="restrictions" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <CardWithGradient gradient="rose">
                  <CardHeader>
                    <CardTitle>Prohibited Uses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Activities that are strictly prohibited when using our services, including
                      abuse, illegal activities, and unauthorized access.
                    </p>
                  </CardContent>
                </CardWithGradient>

                <CardWithGradient gradient="amber">
                  <CardHeader>
                    <CardTitle>Fair Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Guidelines for acceptable use of our services, including API rate limits and
                      resource consumption.
                    </p>
                  </CardContent>
                </CardWithGradient>

                <CardWithGradient gradient="blue">
                  <CardHeader>
                    <CardTitle>Content Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Standards for content shared through our platform, including intellectual
                      property and privacy requirements.
                    </p>
                  </CardContent>
                </CardWithGradient>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <h2>Usage Restrictions</h2>
                <p>
                  To maintain the quality and integrity of our services, the following restrictions
                  apply to all users of Dionysus. Violation of these terms may result in account
                  suspension or termination.
                </p>

                <h3>4.1 Prohibited Activities</h3>
                <p>You agree not to:</p>
                <ul>
                  <li>
                    Use the services for any illegal purposes or to promote illegal activities
                  </li>
                  <li>
                    Attempt to gain unauthorized access to any portion of the services or any other
                    systems
                  </li>
                  <li>Interfere with or disrupt the services or servers</li>
                  <li>Sell, resell, rent, or lease the services without our written permission</li>
                  <li>Reverse engineer or attempt to extract the source code of our software</li>
                  <li>Create multiple accounts to bypass usage limits</li>
                  <li>Use the services to transmit any malware or viruses</li>
                  <li>Harass, abuse, or harm others through the services</li>
                </ul>

                <h3>4.2 API and Resource Usage</h3>
                <p>Users must adhere to the following resource usage guidelines:</p>
                <ul>
                  <li>Respect API rate limits specified in your subscription plan</li>
                  <li>Implement proper error handling and backoff strategies</li>
                  <li>Do not attempt to circumvent any technical limitations</li>
                  <li>Maintain reasonable meeting durations and participant counts</li>
                  <li>Use bandwidth and storage resources responsibly</li>
                </ul>

                <h3>4.3 Content Standards</h3>
                <p>All content shared through Dionysus must:</p>
                <ul>
                  <li>Respect intellectual property rights</li>
                  <li>Maintain participant privacy and confidentiality</li>
                  <li>Not contain hate speech or discriminatory content</li>
                  <li>Not include explicit or inappropriate material</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>

                <h3>4.4 Account Security</h3>
                <p>Users are responsible for:</p>
                <ul>
                  <li>Maintaining the security of their account credentials</li>
                  <li>
                    Using strong passwords and enabling two-factor authentication when available
                  </li>
                  <li>Reporting any suspected unauthorized access</li>
                  <li>Ensuring only authorized users access team accounts</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="liability" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <CardWithGradient gradient="violet">
                  <CardHeader>
                    <CardTitle>Limited Liability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Our liability is limited to the extent permitted by law, and we are not
                      responsible for indirect damages.
                    </p>
                  </CardContent>
                </CardWithGradient>

                <CardWithGradient gradient="emerald">
                  <CardHeader>
                    <CardTitle>Service Warranty</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Services are provided &quot;as is&quot; without any warranties, either express
                      or implied.
                    </p>
                  </CardContent>
                </CardWithGradient>

                <CardWithGradient gradient="blue">
                  <CardHeader>
                    <CardTitle>Indemnification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Users agree to indemnify and hold us harmless from claims arising from their
                      use of the service.
                    </p>
                  </CardContent>
                </CardWithGradient>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <h2>Liability and Disclaimers</h2>

                <h3>5.1 Limitation of Liability</h3>
                <p>
                  To the maximum extent permitted by law, Dionysus and its affiliates shall not be
                  liable for:
                </p>
                <ul>
                  <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Loss of profits, revenue, data, or business opportunities</li>
                  <li>Service interruptions or failures</li>
                  <li>Data loss or corruption</li>
                  <li>Cost of substitute services</li>
                </ul>
                <p>
                  In no event shall our total liability exceed the amount you paid us in the 12
                  months preceding the claim.
                </p>

                <h3>5.2 Warranty Disclaimer</h3>
                <p>
                  The services are provided &quot;as is&quot; and &quot;as available&quot; without
                  warranties of any kind, whether express or implied, including, but not limited to:
                </p>
                <ul>
                  <li>Merchantability</li>
                  <li>Fitness for a particular purpose</li>
                  <li>Non-infringement</li>
                  <li>Error-free or uninterrupted operation</li>
                </ul>
                <p>
                  We do not warrant that the services will meet your specific requirements or
                  expectations.
                </p>

                <h3>5.3 Indemnification</h3>
                <p>
                  You agree to indemnify, defend, and hold harmless Dionysus and its officers,
                  directors, employees, and agents from and against any claims, liabilities,
                  damages, losses, and expenses, including reasonable attorneys&apos; fees, arising
                  from or relating to:
                </p>
                <ul>
                  <li>Your use of the services</li>
                  <li>Your violation of these terms</li>
                  <li>Your content shared through the services</li>
                  <li>Your interaction with other users</li>
                  <li>Your violation of any third-party rights</li>
                </ul>

                <h3>5.4 Force Majeure</h3>
                <p>
                  We shall not be liable for any failure or delay in performance due to
                  circumstances beyond our reasonable control, including but not limited to:
                </p>
                <ul>
                  <li>Natural disasters</li>
                  <li>Acts of war or terrorism</li>
                  <li>Pandemics or health emergencies</li>
                  <li>Changes in laws or regulations</li>
                  <li>Internet service provider failures</li>
                  <li>Labor disputes</li>
                </ul>

                <h3>5.5 Third-Party Services</h3>
                <p>Our services may integrate with or link to third-party services. We:</p>
                <ul>
                  <li>Are not responsible for third-party content or services</li>
                  <li>Do not endorse third-party services</li>
                  <li>Have no control over third-party terms or policies</li>
                  <li>Are not liable for any damages related to third-party services</li>
                </ul>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <h2>Account Suspension, Data, and Legal Compliance</h2>
                <ul>
                  <li>
                    We reserve the right to block, suspend, or terminate your access to our services
                    at any time if we detect misuse or any activity that violates our policies. We
                    may or may not provide prior warning.
                  </li>
                  <li>
                    We are not liable for any refunds or compensation, including for active
                    subscriptions, in the event of such action.
                  </li>
                  <li>
                    You may not request deletion of your data if your account is suspended or
                    terminated for policy violations.
                  </li>
                  <li>
                    We reserve the right to initiate legal proceedings and may use your data as
                    evidence.
                  </li>
                  <li>
                    Your data may be shared with authorities if required by legal notice or law
                    enforcement.
                  </li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </ContentContainer>
      </div>
    </div>
  );
}
