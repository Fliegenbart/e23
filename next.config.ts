import type { NextConfig } from "next";
/** The invitation's own address: there, "/" is the Weihnachtsfeier and nothing else. */
const feierHost = [{ type: "host" as const, value: "e23-weihnachtsfeier.vercel.app" }];
const config: NextConfig = {
  poweredByHeader: false,
  // Blog posts are read from disk at request time.
  outputFileTracingIncludes: {
    "/blog": ["./content/blog/**/*"],
    "/blog/*": ["./content/blog/**/*"],
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", has: feierHost, destination: "/weihnachtsfeier" },
        { source: "/en", has: feierHost, destination: "/weihnachtsfeier/en" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      "/blog/:path*",
      "/projekte",
      "/zeitstrahl",
      "/wir",
      "/weihnachtsfeier/anmeldungen",
      "/ki-demo",
    ].map((source) => ({
      source,
      has: feierHost,
      destination: "/",
      permanent: false,
    }));
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
          },
        ],
      },
      {
        // The demo console is framed by /ki-demo only, on this same address.
        source: "/api/ki-demo/backend/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
          },
        ],
      },
    ];
  },
};
export default config;
