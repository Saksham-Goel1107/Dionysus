import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '../components/navbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Privacy Policy | Dionysus',
  description: 'Privacy policy and data protection information for Dionysus',
};

export default function PrivacyPage() {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <div className="container max-w-5xl pb-12 md:py-16">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2 px-0">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
            </div>
            <p className="text-lg text-muted-foreground">Last Updated: June 20, 2025</p>
          </div>
        </div>
        <Separator className="my-6" />

        <Tabs defaultValue="privacy-policy" className="space-y-8">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="privacy-policy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="data-processing">Data Processing</TabsTrigger>
            <TabsTrigger value="cookies">Cookies & Tracking</TabsTrigger>
            <TabsTrigger value="rights">Your Rights</TabsTrigger>
          </TabsList>

          <TabsContent value="privacy-policy" className="space-y-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Introduction</h2>
              <p>
                At Dionysus, we take your privacy seriously. This Privacy Policy explains how we
                collect, use, disclose, and safeguard your information when you use our AI-powered
                meeting assistant service. Please read this policy carefully. If you do not agree
                with the terms of this privacy policy, please do not access the application.
              </p>
              <p>
                We reserve the right to make changes to this Privacy Policy at any time and for any
                reason. We will alert you about any changes by updating the &quot;Last Updated&quot;
                date of this privacy policy. You are encouraged to periodically review this privacy
                policy to stay informed of updates.
              </p>

              <h2>Information We Collect</h2>

              <h3>Personal Information</h3>
              <p>
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul>
                <li>Register for an account</li>
                <li>
                  Express an interest in obtaining information about us or our products and services
                </li>
                <li>Participate in activities on the application</li>
                <li>Contact customer support</li>
              </ul>
              <p>The personal information we collect may include:</p>
              <ul>
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Job title and company</li>
                <li>Billing information</li>
                <li>Preferences and settings</li>
                <li>Profile information</li>
              </ul>

              <h3>Meeting Data</h3>
              <p>When you use our services, we collect data from your meetings, including:</p>
              <ul>
                <li>Audio recordings (when permitted by you)</li>
                <li>Transcripts of meetings</li>
                <li>Meeting metadata (date, time, duration, participants)</li>
                <li>Chat messages sent during meetings</li>
                <li>Notes and action items created during meetings</li>
              </ul>
              <p>
                We consider meeting content to be sensitive information and handle it with the
                utmost care. Meeting content is processed according to your instructions and used
                solely to provide you with the services you request.
              </p>

              <h3>Technical Information</h3>
              <p>
                We automatically collect certain information when you visit, use, or navigate our
                platform. This information does not reveal your specific identity but may include:
              </p>
              <ul>
                <li>Device and usage information</li>
                <li>IP address</li>
                <li>Browser and device characteristics</li>
                <li>Operating system</li>
                <li>Language preferences</li>
                <li>Referring URLs</li>
                <li>Device name</li>
                <li>Country</li>
                <li>Location</li>
                <li>Information about how and when you use our application</li>
              </ul>
              <p>
                This information is primarily needed to maintain the security and operation of our
                platform, and for our internal analytics and reporting purposes.
              </p>

              <h2>How We Use Your Information</h2>
              <p>We may use the information we collect for various purposes, including to:</p>
              <ul>
                <li>Provide, operate, and maintain our services</li>
                <li>Improve, personalize, and expand our services</li>
                <li>Understand and analyze how you use our services</li>
                <li>Develop new products, services, features, and functionality</li>
                <li>
                  Process transactions and send related information including confirmations and
                  invoices
                </li>
                <li>
                  Send administrative information to you, such as changes to our terms, conditions,
                  and policies
                </li>
                <li>Respond to your comments, questions, and requests</li>
                <li>
                  Send you technical notices, updates, security alerts, and support and
                  administrative messages
                </li>
                <li>Provide customer service and support</li>
                <li>
                  Monitor and analyze trends, usage, and activities in connection with our services
                </li>
                <li>Detect, prevent and address technical issues</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h3>AI Processing</h3>
              <p>
                Dionysus uses artificial intelligence and machine learning technologies to power its
                core features. This includes:
              </p>
              <ul>
                <li>Speech recognition for real-time transcription</li>
                <li>Natural language processing for meeting summarization</li>
                <li>Machine learning for action item detection</li>
                <li>AI-based analysis for generating insights</li>
              </ul>
              <p>
                Your data is processed algorithmically to provide these services. We do not use your
                meeting content to train our general AI models without your explicit consent.
              </p>

              <h2>Data Retention</h2>
              <p>
                We will only keep your personal information and meeting data for as long as it is
                necessary for the purposes set out in this privacy policy, unless a longer retention
                period is required or permitted by law.
              </p>
              <p>
                No purpose in this policy will require us keeping your personal information for
                longer than the period of time in which you have an account with us. When you delete
                your account, we will delete or anonymize your information consistent with our data
                retention policies.
              </p>
              <p>
                Meeting recordings and transcripts are retained based on your subscription level:
              </p>
              <ul>
                <li>Free tier: 7 days</li>
                <li>Pro tier: 90 days</li>
                <li>Enterprise tier: Up to 1 year, or as specified in your contract</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="data-processing" className="space-y-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Data Processing</h2>
              <p>
                This section provides detailed information about how we process your data, including
                the legal bases for processing, data transfers, and our security measures.
              </p>

              <h3>Legal Basis for Processing</h3>
              <p>
                We process your personal information for the purposes described in this Privacy
                Policy based on the following legal grounds:
              </p>
              <ul>
                <li>
                  <strong>Performance of a Contract:</strong> Processing your information to fulfill
                  our obligations under our Terms of Service or other agreements with you.
                </li>
                <li>
                  <strong>Legitimate Interests:</strong> Processing your information for our
                  legitimate business interests, such as improving our services and providing
                  security.
                </li>
                <li>
                  <strong>Consent:</strong> Processing your information with your explicit consent
                  for specific purposes.
                </li>
                <li>
                  <strong>Legal Obligations:</strong> Processing your information to comply with
                  applicable laws and regulations.
                </li>
              </ul>

              <h3>Data Transfers</h3>
              <p>
                Dionysus is a global service. Your information may be transferred to, and processed
                in, countries other than the country in which you are resident. These countries may
                have data protection laws that are different from the laws of your country.
              </p>
              <p>
                Specifically, our servers are located in the United States, and our third-party
                service providers and partners operate globally. This means that when we collect
                your information, we may process it in any of these countries.
              </p>
              <p>
                When we transfer your information to other countries, we will protect that
                information as described in this Privacy Policy and in accordance with applicable
                law. We take steps to ensure that adequate safeguards are in place to protect your
                information when it is transferred internationally, including:
              </p>
              <ul>
                <li>Using EU-approved Standard Contractual Clauses</li>
                <li>
                  Ensuring our partners have certified under the EU-U.S. and Swiss-U.S. Privacy
                  Shield frameworks
                </li>
                <li>Implementing appropriate technical and organizational measures</li>
              </ul>

              <h3>Security Measures</h3>
              <p>
                We have implemented appropriate technical and organizational security measures
                designed to protect the security of any personal information we process. However,
                despite our safeguards and efforts to secure your information, no electronic
                transmission over the Internet or information storage technology can be guaranteed
                to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals,
                or other unauthorized third parties will not be able to defeat our security and
                improperly collect, access, steal, or modify your information.
              </p>
              <p>Our security measures include:</p>
              <ul>
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and penetration testing</li>
                <li>Access controls and authentication requirements</li>
                <li>Regular security training for employees</li>
                <li>Physical security measures for our data centers</li>
                <li>Monitoring systems for detecting and addressing security incidents</li>
                <li>Business continuity and disaster recovery plans</li>
              </ul>

              <h3>Third-Party Service Providers</h3>
              <p>
                We may share your information with third-party service providers to assist us in
                providing you with our services. These third parties have access to your personal
                information only to perform these tasks on our behalf and are obligated not to
                disclose or use it for any other purpose.
              </p>
              <p>We use the following categories of third-party service providers:</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Data Shared</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Cloud Infrastructure</TableCell>
                    <TableCell>Hosting our services</TableCell>
                    <TableCell>All data stored in our platform</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Authentication</TableCell>
                    <TableCell>User login and identity verification</TableCell>
                    <TableCell>Email, name, login information</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Payment Processing</TableCell>
                    <TableCell>Processing subscription payments</TableCell>
                    <TableCell>Billing information, transaction history</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Analytics</TableCell>
                    <TableCell>Understanding service usage</TableCell>
                    <TableCell>Usage data, device information</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Customer Support</TableCell>
                    <TableCell>Providing technical assistance</TableCell>
                    <TableCell>Contact information, support tickets</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Email Delivery</TableCell>
                    <TableCell>Sending notifications</TableCell>
                    <TableCell>Email, name, notification preferences</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p>
                We ensure that all third-party service providers agree to strict data protection
                terms that are consistent with this Privacy Policy.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="cookies" className="space-y-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Cookies & Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to collect and use information
                about you. Cookies are small data files stored on your device that allow us to
                recognize your browser and remember certain information.
              </p>

              <h3>Types of Cookies We Use</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Essential</TableCell>
                    <TableCell>
                      Necessary for the website to function properly. These enable basic functions
                      like page navigation and access to secure areas.
                    </TableCell>
                    <TableCell>Session / Persistent</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Analytics</TableCell>
                    <TableCell>
                      Help us understand how visitors interact with our website by collecting and
                      reporting information anonymously.
                    </TableCell>
                    <TableCell>Persistent (up to 2 years)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Functional</TableCell>
                    <TableCell>
                      Enable enhanced functionality and personalization, such as remembering your
                      preferences.
                    </TableCell>
                    <TableCell>Persistent (up to 1 year)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Targeting</TableCell>
                    <TableCell>
                      Used to deliver relevant advertisements based on your interests and track the
                      effectiveness of marketing campaigns.
                    </TableCell>
                    <TableCell>Persistent (up to 1 year)</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <h3>How to Manage Cookies</h3>
              <p>
                Most web browsers allow you to control cookies through their settings preferences.
                To find out more about cookies, including how to see what cookies have been set,
                visit{' '}
                <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer">
                  www.aboutcookies.org
                </a>
                .
              </p>

              <p>
                You can manage browser cookies through your browser settings. Here&apos;s how to
                remove cookies from popular browsers:
              </p>

              <ul>
                <li>
                  <strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site
                  data
                </li>
                <li>
                  <strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data
                </li>
                <li>
                  <strong>Safari:</strong> Preferences → Privacy → Manage Website Data
                </li>
                <li>
                  <strong>Edge:</strong> Settings → Site permissions → Cookies and site data
                </li>
              </ul>

              <p>
                Please note that restricting cookies may impact the functionality of our website.
                Essential cookies cannot be disabled as they are necessary for the website to
                function.
              </p>

              <h3>Do Not Track</h3>
              <p>
                We respect your choice if you enable the &quot;Do Not Track&quot; setting in your
                browser. When DNT is enabled, we do not use analytics or advertising cookies.
              </p>

              <h3>Other Tracking Technologies</h3>
              <p>
                In addition to cookies, we may use web beacons, pixel tags, and other tracking
                technologies to improve your browsing experience, analyze website traffic, and
                gather demographic information about our user base as a whole.
              </p>
              <p>
                These technologies help us understand how users engage with our website and allow us
                to analyze the effectiveness of our marketing campaigns.
              </p>

              <h3>Third-Party Analytics</h3>
              <p>
                We use third-party analytics services to help understand user behavior on our
                website. These services may collect information about your use of our website, which
                is transmitted to the service provider. We use this information to improve our
                website and services.
              </p>
              <p>Our primary analytics providers include:</p>
              <ul>
                <li>Google Analytics</li>
                <li>Mixpanel</li>
                <li>Hotjar</li>
              </ul>
              <p>
                You can opt out of Google Analytics by installing the{' '}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Analytics Opt-out Browser Add-on
                </a>
                .
              </p>
            </div>
          </TabsContent>

          <TabsContent value="rights" className="space-y-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Your Data Protection Rights</h2>
              <p>
                Depending on your location and applicable laws, you may have certain rights
                regarding your personal information. These may include:
              </p>

              <h3>For All Users</h3>
              <ul>
                <li>
                  <strong>Access:</strong> You can request copies of your personal information that
                  we hold.
                </li>
                <li>
                  <strong>Correction:</strong> You can ask us to correct inaccurate personal
                  information.
                </li>
                <li>
                  <strong>Deletion:</strong> You can ask us to delete your personal information in
                  certain circumstances.
                </li>
                <li>
                  <strong>Restriction:</strong> You can ask us to restrict the processing of your
                  personal information.
                </li>
                <li>
                  <strong>Object:</strong> You can object to our processing of your personal
                  information.
                </li>
                <li>
                  <strong>Data Portability:</strong> You can ask that we transfer your personal
                  information to another organization.
                </li>
              </ul>

              <h3>Additional Rights for EU/EEA, UK, and California Residents</h3>
              <p>
                If you are located in the European Economic Area (EEA), United Kingdom, or
                Switzerland, you have additional rights under the General Data Protection Regulation
                (GDPR) and UK GDPR. If you are a California resident, you have rights under the
                California Consumer Privacy Act (CCPA).
              </p>

              <h4>For EU/EEA and UK Residents (GDPR)</h4>
              <p>Under GDPR, you have the right to:</p>
              <ul>
                <li>
                  Withdraw consent at any time if we are processing your information based on
                  consent
                </li>
                <li>Lodge a complaint with your local data protection authority</li>
              </ul>

              <h4>For California Residents (CCPA)</h4>
              <p>Under the CCPA, California residents have the right to:</p>
              <ul>
                <li>Know what personal information is being collected about them</li>
                <li>Know whether their personal information is sold or disclosed and to whom</li>
                <li>Say no to the sale of personal information</li>
                <li>Access their personal information</li>
                <li>Request deletion of their personal information</li>
                <li>Not be discriminated against for exercising their privacy rights</li>
              </ul>
              <p>
                We do not sell personal information as defined by the CCPA. We have not sold any
                personal information in the preceding 12 months.
              </p>

              <h3>How to Exercise Your Rights</h3>
              <p>To exercise any of these rights, please contact us at:</p>
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:sakshamgoel1107@gmail.com">sakshamgoel1107@gmail.com</a>
              </p>
              <p>
                We will respond to your request within 30 days. We may need to verify your identity
                before processing your request.
              </p>

              <h3>Children&apos;s Privacy</h3>
              <p>
                Our services are not intended for use by children under the age of 13, and we do not
                knowingly collect personal information from children under 13. If we discover that a
                child under 13 has provided us with personal information, we will promptly delete
                such information from our systems.
              </p>
              <p>
                If you are a parent or guardian and you are aware that your child has provided us
                with personal information, please contact us so that we can take necessary actions.
              </p>

              <h3>Changes to This Privacy Policy</h3>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any
                changes by posting the new Privacy Policy on this page and updating the &quot;Last
                Updated&quot; date at the top of this page. You are advised to review this Privacy
                Policy periodically for any changes.
              </p>
              <p>
                Changes to this Privacy Policy are effective when they are posted on this page. If
                we make material changes to this policy, we will notify you through a notice on our
                website or by email.
              </p>

              <h3>Contact Us</h3>
              <p>If you have any questions about this Privacy Policy, please contact us:</p>
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:sakshamgoel1107@gmail.com">sakshamgoel1107@gmail.com</a>
                <br />
                <strong>Phone:</strong> +91 8882534712
              </p>
              <p>
                For data subjects in the EU, our EU representative can be contacted at:
                <a href="mailto:sakshamgoel1107@gmail.com">sakshamgoel1107@gmail.com</a>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
