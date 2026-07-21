import { Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { setAnalyticsConsent, useAnalyticsConsent } from "@/lib/analytics"

export function AnalyticsConsentBanner() {
  const consent = useAnalyticsConsent()
  if (consent !== "unknown") return null

  return (
    <section
      aria-labelledby="analytics-preferences-title"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl border bg-background p-4 shadow-lg sm:p-5"
    >
      <h2 id="analytics-preferences-title" className="font-semibold">
        Analytics preferences
      </h2>
      <p className="mt-1 text-sm/relaxed text-muted-foreground">
        Anonymous usage analytics help improve EnvSift. ENV contents, keys,
        values, filenames, and copied output are never included. Read the{" "}
        <Link
          to="/privacy"
          className="font-medium text-foreground underline underline-offset-3"
          data-ph-capture
          data-ph-capture-attribute-action="navigate"
          data-ph-capture-attribute-destination="privacy"
          data-ph-capture-attribute-location="consent_banner"
        >
          privacy details
        </Link>
        .
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setAnalyticsConsent("accepted", "banner")}
        >
          Accept analytics
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setAnalyticsConsent("declined", "banner")}
        >
          Decline
        </Button>
      </div>
    </section>
  )
}

export function AnalyticsConsentControls() {
  const consent = useAnalyticsConsent()
  const status =
    consent === "accepted"
      ? "Accepted"
      : consent === "declined"
        ? "Declined"
        : "Not decided"

  return (
    <section
      className="border bg-card p-5"
      aria-labelledby="analytics-controls"
    >
      <h2 id="analytics-controls" className="text-xl font-semibold">
        Analytics preference
      </h2>
      <p className="mt-3 text-sm/relaxed text-muted-foreground">
        Current status: <strong className="text-foreground">{status}</strong>.
        Changes affect future analytics. Declining or withdrawing analytics does
        not change any EnvSift feature.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          disabled={consent === "accepted"}
          onClick={() => setAnalyticsConsent("accepted", "privacy")}
        >
          {consent === "accepted" ? "Analytics accepted" : "Accept analytics"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={consent === "declined"}
          onClick={() => setAnalyticsConsent("declined", "privacy")}
        >
          {consent === "accepted"
            ? "Withdraw analytics"
            : consent === "declined"
              ? "Analytics declined"
              : "Decline analytics"}
        </Button>
      </div>
      <p className="mt-3 text-xs/relaxed text-muted-foreground">
        Browser Do Not Track remains respected even after acceptance.
      </p>
    </section>
  )
}
