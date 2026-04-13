import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – Bruster's of La Cañada",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-white px-4">
        <Link
          href="/"
          aria-label="Back to home"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-charcoal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-charcoal">
          Privacy Policy
        </h1>
        <div className="w-11" />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        <div className="prose prose-sm max-w-none text-charcoal">
          <p className="text-sm text-muted">Last updated: April 13, 2026</p>

          <h2 className="mt-6 text-lg font-bold">1. Introduction</h2>
          <p>
            Bruster&apos;s of La Ca&ntilde;ada (&quot;we,&quot; &quot;us,&quot;
            or &quot;our&quot;) respects your privacy. This Privacy Policy
            explains how we collect, use, and protect your personal information
            when you use our online ordering service.
          </p>

          <h2 className="mt-6 text-lg font-bold">
            2. Information We Collect
          </h2>
          <p>When you place an order, we may collect the following:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>
              <strong>Name</strong> &mdash; to identify your order
            </li>
            <li>
              <strong>Phone number</strong> &mdash; to notify you via SMS when
              your order is ready
            </li>
            <li>
              <strong>Location data</strong> &mdash; GPS coordinates (only if
              you choose to share your location for curbside delivery) or a
              description of your vehicle
            </li>
            <li>
              <strong>Payment information</strong> &mdash; processed securely by
              our payment provider, Square. We do not store your credit card
              number on our servers.
            </li>
            <li>
              <strong>Order details</strong> &mdash; items ordered, order total,
              and order status
            </li>
          </ul>

          <h2 className="mt-6 text-lg font-bold">
            3. How We Use Your Information
          </h2>
          <p>We use your information to:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>Process and fulfill your order</li>
            <li>
              Send you a one-time SMS notification when your order is ready
            </li>
            <li>Locate your vehicle for curbside delivery</li>
            <li>Improve our service and menu offerings</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="mt-6 text-lg font-bold">4. Third-Party Services</h2>
          <p>
            We use the following third-party services to operate our ordering
            platform:
          </p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>
              <strong>Square</strong> &mdash; for secure payment processing.
              Square&apos;s privacy policy is available at{" "}
              <a
                href="https://squareup.com/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand underline"
              >
                squareup.com/legal/privacy
              </a>
            </li>
            <li>
              <strong>PostHog</strong> &mdash; for anonymous usage analytics to
              understand how customers use our ordering platform. No personally
              identifiable information is shared with PostHog.
            </li>
            <li>
              <strong>Vercel</strong> &mdash; for hosting our website
            </li>
            <li>
              <strong>Neon</strong> &mdash; for secure database hosting
            </li>
          </ul>

          <h2 className="mt-6 text-lg font-bold">5. SMS Communications</h2>
          <p>
            By providing your phone number at checkout, you consent to receive
            a one-time SMS message notifying you that your order is ready. We
            will not use your phone number for marketing or any other purpose.
            Standard messaging rates may apply.
          </p>

          <h2 className="mt-6 text-lg font-bold">6. Cookies &amp; Analytics</h2>
          <p>
            Our website uses cookies and local storage to maintain your shopping
            cart between sessions. We also use PostHog for anonymous analytics to
            understand usage patterns and improve our service. You can disable
            cookies in your browser settings, but this may affect cart
            functionality.
          </p>

          <h2 className="mt-6 text-lg font-bold">7. Data Retention</h2>
          <p>
            Order data is retained for business record-keeping and may be
            required for tax and legal purposes. Location data (GPS coordinates)
            is stored only as part of the order record and is not used beyond
            fulfilling your delivery. We do not sell your personal information to
            third parties.
          </p>

          <h2 className="mt-6 text-lg font-bold">
            8. Your Rights (California Residents)
          </h2>
          <p>
            Under the California Consumer Privacy Act (CCPA), California
            residents have the right to:
          </p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>
              Know what personal information we collect and how it is used
            </li>
            <li>Request deletion of your personal information</li>
            <li>Opt out of the sale of personal information (we do not sell your data)</li>
            <li>Not be discriminated against for exercising these rights</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, please contact us at our La Ca&ntilde;ada
            Flintridge location during business hours.
          </p>

          <h2 className="mt-6 text-lg font-bold">9. Data Security</h2>
          <p>
            We take reasonable measures to protect your information. Payment data
            is handled entirely by Square using industry-standard encryption. Our
            database is hosted securely with encrypted connections. However, no
            method of transmission over the internet is 100% secure.
          </p>

          <h2 className="mt-6 text-lg font-bold">
            10. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with an updated date. Your continued use of our
            service constitutes acceptance of the updated policy.
          </p>

          <h2 className="mt-6 text-lg font-bold">11. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy or your
            personal data, please contact us at our La Ca&ntilde;ada Flintridge
            location during business hours.
          </p>
        </div>

        <div className="mt-8 border-t border-border pt-4 text-center">
          <Link href="/terms" className="text-sm text-brand underline">
            Terms of Service
          </Link>
        </div>
      </main>
    </div>
  );
}
