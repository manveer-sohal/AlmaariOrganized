import type { Metadata } from "next";
import type { ReactNode } from "react";
import MarketingShell from "../components/MarketingShell";
import { createPageMetadata } from "../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "Privacy Policy for Almaari (almaari.app): how we collect, store, use, and protect your account, wardrobe, and AI-related data.",
  path: "/privacy",
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

export default function PrivacyPage() {
  return (
    <MarketingShell
      title="Privacy Policy"
      description="How Almaari collects, uses, and protects information when you use https://almaari.app."
    >
      <p className="text-sm text-indigo-700/75">
        Effective date: July 18, 2026
      </p>

      <Section title="Who operates Almaari">
        <p>
          Almaari is operated by an individual based in Brampton, Ontario,
          Canada (“Almaari,” “we,” “us,” or “our”). Almaari is the AI wardrobe
          organizer and personal stylist available at{" "}
          <a
            href="https://almaari.app"
            className="font-medium text-indigo-700 underline-offset-2 hover:underline"
          >
            https://almaari.app
          </a>
          .
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For privacy questions, account requests, or data concerns, email{" "}
          <a
            href="mailto:almaari.support@gmail.com"
            className="font-medium text-indigo-700 underline-offset-2 hover:underline"
          >
            almaari.support@gmail.com
          </a>
          .
        </p>
      </Section>

      <Section title="Information we collect">
        <p>
          We collect information needed to create your account, run the product,
          and respond to your requests. Depending on how you use Almaari, this
          may include:
        </p>
        <ul className={listClass}>
          <li>
            <strong className="font-semibold text-indigo-950">
              Account information
            </strong>
            , such as your name, email address, and profile details associated
            with your sign-in method.
          </li>
          <li>
            <strong className="font-semibold text-indigo-950">
              Authentication information
            </strong>{" "}
            provided through our authentication providers so we can verify your
            identity and keep you signed in. Almaari never stores your
            passwords.
          </li>
          <li>
            <strong className="font-semibold text-indigo-950">
              Clothing images
            </strong>{" "}
            you upload to build your digital wardrobe.
          </li>
          <li>
            <strong className="font-semibold text-indigo-950">
              Wardrobe metadata
            </strong>
            , such as tags, categories, colors, materials, outfit compositions,
            and other details used to organize and style your clothes.
          </li>
          <li>
            <strong className="font-semibold text-indigo-950">
              Chat prompts and AI requests
            </strong>
            , including styling prompts, outfit-generation requests, and related
            instructions you submit when using AI features.
          </li>
          <li>
            <strong className="font-semibold text-indigo-950">
              Technical information
            </strong>{" "}
            required to operate the service, such as basic request logs, device
            or browser details needed for security and reliability, and account
            activity related to core product functions (for example, uploading
            items or generating outfits).
          </li>
          <li>
            <strong className="font-semibold text-indigo-950">
              Payment-related information
            </strong>{" "}
            when you make a purchase. Card details are handled by our payment
            processor; Almaari does not store full payment card numbers.
          </li>
        </ul>
        <p>
          We do not collect advertising profiles, and we do not currently
          operate a separate analytics product that tracks you across sites for
          marketing purposes.
        </p>
      </Section>

      <Section title="Authentication">
        <p>
          Sign-in is provided through Auth0, including Google Sign-In where
          available. When you authenticate, Auth0 (and, if you choose Google,
          Google) process identity information according to their own policies
          so Almaari can create and manage your session. Almaari never stores
          user passwords.
        </p>
      </Section>

      <Section title="How we use information">
        <p>We use the information described above to:</p>
        <ul className={listClass}>
          <li>provide and maintain your account and digital wardrobe;</li>
          <li>store, display, organize, and analyze clothing you upload;</li>
          <li>
            generate outfits, styling suggestions, and other AI-assisted
            features you request;
          </li>
          <li>
            process purchases and related account credits when applicable;
          </li>
          <li>
            secure the service, prevent abuse, troubleshoot issues, and
            communicate with you about your account or support requests.
          </li>
        </ul>
        <p>
          We do not claim ownership of your clothing images or wardrobe content.
          You retain ownership of the content you upload.
        </p>
      </Section>

      <Section title="Storage">
        <p>
          Clothing images are stored securely in Amazon Web Services (AWS) S3.
          Wardrobe data and related account records are stored in MongoDB. We
          use these systems to host and operate Almaari reliably.
        </p>
      </Section>

      <Section title="AI processing">
        <p>
          Almaari uses OpenAI to help power outfit generation, wardrobe analysis,
          and AI styling assistance. When you use those features, clothing
          images, wardrobe metadata, outfit descriptions, and chat prompts may
          be sent to OpenAI solely to provide the functionality you requested.
        </p>
        <p>
          Almaari does not use your content to train AI models. Our API
          providers process data to deliver the requested functionality in
          accordance with their own policies and terms. Those providers act as
          service providers for the features you use, not as buyers of your
          personal wardrobe data.
        </p>
      </Section>

      <Section title="Data sharing">
        <p>
          Almaari does not sell or rent personal data. We share information only
          with infrastructure and service providers needed to operate Almaari,
          including:
        </p>
        <ul className={listClass}>
          <li>authentication providers (Auth0 and Google Sign-In);</li>
          <li>cloud storage and hosting (including AWS S3);</li>
          <li>database hosting for MongoDB;</li>
          <li>AI providers (including OpenAI) for requested AI features;</li>
          <li>
            payment processors when you purchase credits or other paid
            offerings.
          </li>
        </ul>
        <p>
          We may also disclose information if required by law, to protect the
          rights or safety of Almaari or users, or in connection with a
          legitimate legal process.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          Authentication providers may use cookies or similar technologies that
          are required for secure sign-in and account management. Almaari
          currently does not use advertising cookies or analytics cookies.
        </p>
      </Section>

      <Section title="Retention">
        <p>
          When you delete a wardrobe item, we remove it from active systems used
          to run your account. When you delete your account, we schedule the
          account and associated active data for deletion. Backups may be
          retained for up to 30 days before permanent deletion. Some limited
          records may be kept longer where needed for security, fraud
          prevention, legal compliance, or dispute resolution.
        </p>
      </Section>

      <Section title="Your rights and choices">
        <p>You can:</p>
        <ul className={listClass}>
          <li>delete wardrobe items from your account;</li>
          <li>
            delete your account, or request account deletion by contacting us;
          </li>
          <li>
            email{" "}
            <a
              href="mailto:almaari.support@gmail.com"
              className="font-medium text-indigo-700 underline-offset-2 hover:underline"
            >
              almaari.support@gmail.com
            </a>{" "}
            with privacy questions or requests about your information.
          </li>
        </ul>
        <p>
          Depending on where you live, you may have additional rights under
          applicable privacy laws. Contact us and we will work with you in good
          faith to address your request.
        </p>
      </Section>

      <Section title="Children">
        <p>
          Almaari is intended for users who are at least 13 years old, or the
          minimum age required by applicable law in your jurisdiction, whichever
          is higher. We do not knowingly collect personal information from
          children below that age. If you believe a child has provided us with
          personal information, please contact us so we can take appropriate
          action.
        </p>
      </Section>

      <Section title="Security">
        <p>
          We use reasonable technical and organizational safeguards designed to
          protect your information. No online service can guarantee absolute
          security, and you use Almaari understanding that residual risk
          remains.
        </p>
      </Section>

      <Section title="Changes to this Privacy Policy">
        <p>
          We may update this Privacy Policy from time to time as Almaari
          evolves. When we do, we will change the effective date above. Please
          review this page periodically. Continued use of Almaari after an
          update means you acknowledge the revised policy.
        </p>
      </Section>
    </MarketingShell>
  );
}
