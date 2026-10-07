import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every Pickly screen is per-user and per-tenant, so routes render dynamically.
  // Cache Components can be adopted later for marketing / static pages.
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
