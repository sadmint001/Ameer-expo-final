import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import "../lib/google-translate-patch";

import { Toaster } from "@/components/ui/sonner";
import { GlobalAnnouncements } from "@/components/expo/GlobalAnnouncements";
import { WhatsAppButton } from "@/components/expo/WhatsAppButton";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ameer Expo Africa & Middle East 2026 | Register Now" },
      {
        name: "description",
        content:
          "Register for Ameer Expo Africa & Middle East 2026 — 18-20 September, Sarit Expo Centre, Nairobi. Connecting Africa and the Middle East through business, innovation, trade and investment.",
      },
      { name: "author", content: "Ameer Group Ltd" },
      { property: "og:title", content: "Ameer Expo Africa & Middle East 2026" },
      {
        property: "og:description",
        content:
          "The premier business, trade & innovation expo — Nairobi, 18-20 September 2026. Register as a visitor, exhibitor or sponsor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon-64.png?v=2", type: "image/png", sizes: "64x64" },
      { rel: "shortcut icon", href: "/favicon-64.png?v=2" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <GoogleTranslateLoader />
        <div id="google_translate_element" className="hidden" suppressHydrationWarning></div>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function GoogleTranslateLoader() {
  useEffect(() => {
    const googleWindow = window as Window & {
      google?: {
        translate?: {
          TranslateElement?: new (
            options: { pageLanguage: string; autoDisplay: boolean },
            elementId: string,
          ) => unknown;
        };
      };
      googleTranslateElementInit?: () => void;
    };

    const existingScript = document.getElementById("google-translate-script");
    if (existingScript) return;

    googleWindow.googleTranslateElementInit = function () {
      if (!googleWindow.google?.translate?.TranslateElement) return;

      new googleWindow.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element",
      );
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <GlobalAnnouncements />
      <Toaster position="top-right" />
      <WhatsAppButton />
    </QueryClientProvider>
  );
}
