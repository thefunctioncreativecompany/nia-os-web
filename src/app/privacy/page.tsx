import type { Metadata } from "next";
import Link from "next/link";


export const metadata: Metadata = {
  title: "Privacy Policy · Nia OS",
};

const CONTACT_EMAIL = "thefunctioncreativecompany@gmail.com";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full flex-col bg-background text-foreground">
      <header className="border-b border-nia-line px-4 py-6 md:px-15">
        <Link
          href="/"
          className="font-wordmark text-wordmark font-bold"
        >
          NIA
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 md:py-16">
        <h1 className="text-h1 font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-nia-ink-muted">Last updated: October 17, 2026</p>

        <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed text-nia-ink-muted [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-nia-ink [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
          <section>
            <p>
              Nia Technologies Inc. (&ldquo;Nia&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) runs
              Nia OS, an AI-enabled content production operating system. This policy explains
              what information we collect when you use Nia OS, how we use it, and the choices
              you have.
            </p>
          </section>

          <section>
            <h2>Information we collect</h2>
            <ul>
              <li>
                <strong className="text-nia-ink">Account details:</strong> your name, email
                address and password when you create an account. Passwords are stored securely
                by our authentication provider and are never visible to us.
              </li>
              <li>
                <strong className="text-nia-ink">Google sign-in:</strong> if you choose
                &ldquo;Continue with Google&rdquo;, Google shares your name, email address and
                profile photo with us. We do not get access to your Gmail, Drive, contacts or
                any other Google data.
              </li>
              <li>
                <strong className="text-nia-ink">Profile and workspace content:</strong>{" "}
                information you add yourself, such as a profile photo, role, bio and your
                preferences.
              </li>
              <li>
                <strong className="text-nia-ink">Technical information:</strong> cookies that
                keep you signed in, and standard logs (such as IP address and browser type) kept
                by our hosting providers for security and reliability.
              </li>
            </ul>
          </section>

          <section>
            <h2>How we use your information</h2>
            <ul>
              <li>To create and secure your account and let you sign in.</li>
              <li>To provide, maintain and improve Nia OS.</li>
              <li>
                To send account emails, such as sign-up confirmations and password resets.
              </li>
              <li>To prevent fraud and abuse, and to meet legal obligations.</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal information and we do not use it for advertising.
            </p>
          </section>

          <section>
            <h2>Google user data</h2>
            <p>
              Nia OS uses information received from Google only to sign you in and to show your
              name and photo in your account. Nia&apos;s use and transfer of information received
              from Google APIs will adhere to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                className="text-nia-ink underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2>Who we share it with</h2>
            <p>
              We share information only with service providers that help us run Nia OS, under
              agreements that protect it:
            </p>
            <ul>
              <li>Supabase, for sign-in, our database and file storage.</li>
              <li>Vercel, for hosting the website.</li>
            </ul>
            <p className="mt-3">
              We may also disclose information if required by law or to protect the rights and
              safety of our users.
            </p>
          </section>

          <section>
            <h2>Keeping and deleting your information</h2>
            <p>
              We keep your information for as long as your account is active. You can ask us to
              delete your account and its data at any time by emailing{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-nia-ink underline">
                {CONTACT_EMAIL}
              </a>
              . You can also ask for a copy of your information or for it to be corrected.
            </p>
          </section>

          <section>
            <h2>Security</h2>
            <p>
              We use industry-standard measures, including encrypted connections and access
              controls, to protect your information. No system is completely secure, but we work
              to keep your data safe.
            </p>
          </section>

          <section>
            <h2>Children</h2>
            <p>
              Nia OS is not intended for children under 13, and we do not knowingly collect their
              information.
            </p>
          </section>

          <section>
            <h2>Changes to this policy</h2>
            <p>
              We may update this policy from time to time. We will change the date at the top and,
              for significant changes, let you know by email or in the app.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Questions about this policy? Email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-nia-ink underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-nia-footer px-4 py-5">
        <p className="text-center text-small leading-normal text-white/50">
          NIA is an AI-enabled content production operating system.
        </p>
      </footer>
    </div>
  );
}
