import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – Park and Order by Juni Platforms",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <div className="w-11" />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        <div className="prose prose-sm max-w-none text-charcoal">
          <p className="text-sm text-muted">Last updated: April 13, 2026</p>

          <h2 className="mt-6 text-lg font-bold">1. Overview</h2>
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your use of the
            online ordering service operated by Park and Order by Juni
            Platforms (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            By placing an order through our website, you agree to be bound by
            these Terms.
          </p>

          <h2 className="mt-6 text-lg font-bold">2. Service Description</h2>
          <p>
            We provide a web-based ordering platform that allows you to browse
            our menu, place orders, and receive your items via curbside delivery
            or counter pickup at participating locations.
          </p>

          <h2 className="mt-6 text-lg font-bold">3. Orders &amp; Payment</h2>
          <p>
            All orders are subject to availability. Prices shown on the menu
            include the item price only; applicable sales tax is added at
            checkout. Payment is processed at the time your order is placed. We
            accept payment methods made available through our payment processor,
            Square. By submitting an order, you authorize us to charge the
            payment method you provide.
          </p>

          <h2 className="mt-6 text-lg font-bold">
            4. Cancellations &amp; Refunds
          </h2>
          <p>
            You may request cancellation of an order before preparation begins.
            Once an order is being prepared, it cannot be cancelled. If you
            believe there is an issue with your order (incorrect items, quality
            concerns), please speak with our staff at the time of pickup or
            delivery. Refunds are handled on a case-by-case basis at our
            discretion.
          </p>

          <h2 className="mt-6 text-lg font-bold">5. Accuracy of Information</h2>
          <p>
            You agree to provide accurate and complete information when placing
            an order, including your name, phone number, and vehicle description
            or location. We are not responsible for orders that cannot be
            delivered due to inaccurate information.
          </p>

          <h2 className="mt-6 text-lg font-bold">6. Acceptable Use</h2>
          <p>
            You agree not to misuse our ordering platform, including but not
            limited to: placing fraudulent orders, using stolen payment methods,
            interfering with the platform&apos;s operation, or engaging in any
            activity that violates applicable law.
          </p>

          <h2 className="mt-6 text-lg font-bold">
            7. Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by law, Park and Order by Juni
            Platforms shall not be liable for any indirect, incidental,
            special, or consequential damages arising from your use of our
            ordering service. Our total liability for any claim shall not exceed
            the amount you paid for the order giving rise to the claim.
          </p>

          <h2 className="mt-6 text-lg font-bold">8. Disclaimer</h2>
          <p>
            Our ordering service is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, either express or
            implied. We do not guarantee uninterrupted or error-free operation of
            the platform.
          </p>

          <h2 className="mt-6 text-lg font-bold">9. Changes to These Terms</h2>
          <p>
            We reserve the right to update these Terms at any time. Changes will
            be effective when posted on this page with an updated date. Your
            continued use of the service after changes constitutes acceptance of
            the updated Terms.
          </p>

          <h2 className="mt-6 text-lg font-bold">10. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of California,
            without regard to conflict of law provisions. Any disputes arising
            from these Terms shall be resolved in the courts of Los Angeles
            County, California.
          </p>

          <h2 className="mt-6 text-lg font-bold">11. Contact Us</h2>
          <p>
            If you have questions about these Terms, please contact us at
            thejuni2@gmail.com.
          </p>
        </div>

        <div className="mt-8 border-t border-border pt-4 text-center">
          <Link href="/privacy" className="text-sm text-brand underline">
            Privacy Policy
          </Link>
        </div>
      </main>
    </div>
  );
}
