import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
export default function TermsOfServicePage() {
    return (<div className="container mx-auto px-6 py-12 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Terms of Service</CardTitle>
          <p className="text-center text-muted-foreground">Last updated: January 2024</p>
        </CardHeader>
        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using UGCVideo's services, you accept and agree to be bound by the 
              terms and provision of this agreement. If you do not agree to these terms, you should 
              not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              UGCVideo provides AI-powered video generation services that create user-generated 
              content (UGC) style videos based on uploaded images and text prompts. Our service 
              is designed for marketing, advertising, and content creation purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. User Accounts and Registration</h2>
            <p className="mb-4">
              To use our services, you must create an account and provide accurate, complete information. 
              You are responsible for maintaining the security of your account and password.
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You must be at least 18 years old to use our services</li>
              <li>One person or legal entity may maintain only one account</li>
              <li>You are responsible for all activity under your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Acceptable Use Policy</h2>
            <p className="mb-4">You agree not to use our services to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Create content that is illegal, harmful, or violates others' rights</li>
              <li>Generate videos containing hate speech, violence, or explicit content</li>
              <li>Impersonate others without permission</li>
              <li>Upload copyrighted images without proper authorization</li>
              <li>Create deepfakes or misleading content intended to deceive</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Content and Intellectual Property</h2>
            <p className="mb-4">
              You retain ownership of the images you upload and the text prompts you provide. 
              However, you grant us a license to use this content to provide our services.
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You own the generated videos created from your inputs</li>
              <li>You must have rights to all uploaded images</li>
              <li>We reserve the right to remove content that violates our policies</li>
              <li>You may use generated videos for commercial purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Payment Terms</h2>
            <p className="mb-4">
              Our services operate on a credit-based system. By purchasing credits, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Pay all fees associated with your selected plan</li>
              <li>Credits are non-refundable once used</li>
              <li>Unused credits do not expire but are non-transferable</li>
              <li>Prices are subject to change with notice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Service Availability</h2>
            <p className="mb-4">
              We strive to maintain high service availability but do not guarantee uninterrupted access. 
              We reserve the right to modify, suspend, or discontinue services with reasonable notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="mb-4">
              UGCVideo and its affiliates shall not be liable for any indirect, incidental, special, 
              or consequential damages arising from your use of our services. Our total liability 
              is limited to the amount you paid for services in the last 12 months.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Privacy and Data Protection</h2>
            <p className="mb-4">
              Your privacy is important to us. Please review our Privacy Policy to understand 
              how we collect, use, and protect your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Termination</h2>
            <p className="mb-4">
              Either party may terminate this agreement at any time. Upon termination:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Your access to services will cease</li>
              <li>Unused credits will be forfeited</li>
              <li>We may delete your account and associated data</li>
              <li>These terms will remain in effect for past usage</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. Material changes will be 
              communicated via email or platform notification. Continued use constitutes acceptance 
              of updated terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Governing Law</h2>
            <p className="mb-4">
              These terms shall be governed by and construed in accordance with applicable law. 
              Any disputes will be resolved through binding arbitration.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Contact Information</h2>
            <p className="mb-4">
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="mb-4">
              Email: legal@ugcvideo.com<br />
              Address: [Your Business Address]
            </p>
          </section>
        </CardContent>
      </Card>
    </div>);
}
