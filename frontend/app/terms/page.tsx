import type { Metadata } from "next";
import type { ReactNode } from "react";
import MarketingShell from "../components/MarketingShell";
import { createPageMetadata } from "../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Terms of Use",
  description:
    "Terms of Use for Almaari (almaari.app): accounts, user content, AI features, payments, and acceptable use.",
  path: "/terms",
});

const listClass =
  "list-disc space-y-2 pl-5 marker:text-indigo-400 text-indigo-900/85";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-indigo-950">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <MarketingShell
      title="Terms of Use"
      description="The agreement that governs your use of Almaari at https://almaari.app."
    >
      <p className="text-sm text-indigo-700/75">
        Effective date: July 18, 2026
      </p>

      <Section title="Acceptance of terms">
        <p>
          These Terms of Use (“Terms”) are an agreement between you and Almaari,
          operated by an individual based in Brampton, Ontario, Canada. By
          accessing or using Almaari at{" "}
          <a
            href="https://almaari.app"
            className="font-medium text-indigo-700 underline-offset-2 hover:underline"
          >
            https://almaari.app
          </a>
          , creating an account, or using any Almaari feature, you agree to
          these Terms. If you do not agree, do not use the service.
        </p>
      </Section>

      <Section title="Eligibility">
        <p>
          You must be at least 13 years old, or the minimum age required by
          applicable law in your jurisdiction, whichever is higher, to use
          Almaari. By using the service, you represent that you meet this
          requirement.
        </p>
      </Section>

      <Section title="The service">
        <p>
          Almaari is an AI wardrobe organizer and personal stylist that helps you
          catalog clothing, create outfits, and receive styling assistance.
          Features may change over time and may include recommendations, closet
          sharing, social features, and other tools we add to the product. These
          Terms apply to current and future features made available through
          Almaari unless we publish separate terms for a specific offering.
        </p>
      </Section>

      <Section title="Accounts">
        <p>
          Authentication is handled through Auth0, including Google Sign-In
          where available. Almaari does not store your passwords. You are
          responsible for maintaining the security of your account and for all
          activity that occurs under your account. Notify us promptly at{" "}
          <a
            href="mailto:almaari.support@gmail.com"
            className="font-medium text-indigo-700 underline-offset-2 hover:underline"
          >
            almaari.support@gmail.com
          </a>{" "}
          if you believe your account has been compromised.
        </p>
      </Section>

      <Section title="User content">
        <p>
          You retain ownership of all clothing images and wardrobe content you
          upload to Almaari. Almaari does not claim ownership of your content.
        </p>
        <p>
          By uploading or submitting content, you grant Almaari a limited,
          non-exclusive license to store, process, display, and analyze that
          content solely as needed to operate and provide the service to you.
          This license ends when the content is deleted from active systems,
          subject to ordinary backup retention and legal requirements described
          in our Privacy Policy.
        </p>
        <p>
          You represent that you have the rights needed to upload your content
          and that your content does not violate these Terms or applicable law.
        </p>
      </Section>

      <Section title="AI features">
        <p>
          Almaari may provide AI-generated outfit suggestions, wardrobe analysis,
          styling recommendations, and related assistance. These outputs are
          informational only. They may occasionally be inaccurate, incomplete,
          or unsuitable for your situation. You should use your own judgment
          before relying on any AI suggestion.
        </p>
      </Section>

      <Section title="Prohibited conduct">
        <p>You agree not to:</p>
        <ul className={listClass}>
          <li>use Almaari for any unlawful purpose;</li>
          <li>
            upload content that infringes copyright, trademark, or other rights
            of another person;
          </li>
          <li>
            upload abusive, harassing, hateful, or otherwise harmful content;
          </li>
          <li>
            reverse engineer, decompile, or attempt to extract source code or
            underlying models except where allowed by law;
          </li>
          <li>
            scrape, crawl, or harvest data from Almaari without our prior
            written permission;
          </li>
          <li>
            interfere with or disrupt the service, including by introducing
            malware or overloading systems;
          </li>
          <li>
            attempt unauthorized access to accounts, systems, or data that are
            not yours.
          </li>
        </ul>
      </Section>

      <Section title="Payments">
        <p>
          Almaari may offer one-time purchases, such as credits or similar paid
          features. Prices, available offerings, and payment terms may change
          over time. Purchases are processed by third-party payment providers.
          Except where required by law, fees are generally non-refundable once
          the purchase has been completed and the related product benefit has
          been delivered.
        </p>
      </Section>

      <Section title="Termination">
        <p>
          You may stop using Almaari and delete your account at any time.
          Almaari may suspend or terminate your access if you violate these
          Terms, misuse the service, or create risk for Almaari or other users.
          Upon termination, your right to use the service ends, and we may
          delete or disable access to your account data in accordance with our
          Privacy Policy.
        </p>
      </Section>

      <Section title="Warranty disclaimer">
        <p>
          Almaari is provided “as is” and “as available.” To the fullest extent
          permitted by law, we disclaim all warranties, whether express or
          implied, including merchantability, fitness for a particular purpose,
          and non-infringement. We do not warrant that the service will be
          uninterrupted, error-free, or that AI outputs will meet your
          expectations.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, Almaari and its operator will
          not be liable for any indirect, incidental, special, consequential, or
          punitive damages, or for any loss of profits, data, goodwill, or other
          intangible losses, arising out of or related to your use of the
          service.
        </p>
        <p>
          To the fullest extent permitted by law, our total liability for any
          claim arising out of or relating to these Terms or Almaari will not
          exceed the greater of (a) the amounts you paid to Almaari in the
          twelve (12) months before the claim, or (b) CAD $50 if you have not
          paid anything.
        </p>
        <p>
          Some jurisdictions do not allow certain limitations. In those places,
          the limitations apply only to the maximum extent permitted by law.
        </p>
      </Section>

      <Section title="Governing law">
        <p>
          These Terms are governed by the laws of the Province of Ontario and
          the applicable federal laws of Canada, without regard to
          conflict-of-law rules. Courts located in Ontario, Canada will have
          exclusive jurisdiction over disputes arising from these Terms, except
          where prohibited by applicable law.
        </p>
      </Section>

      <Section title="Changes to these Terms">
        <p>
          We may update these Terms from time to time. When we do, we will
          revise the effective date above. Continued use of Almaari after
          changes become effective constitutes acceptance of the updated Terms.
          If you do not agree, you must stop using the service and may delete
          your account.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these Terms can be sent to{" "}
          <a
            href="mailto:almaari.support@gmail.com"
            className="font-medium text-indigo-700 underline-offset-2 hover:underline"
          >
            almaari.support@gmail.com
          </a>
          .
        </p>
      </Section>
    </MarketingShell>
  );
}
