import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Explicitly point to i18n/request.ts (auto-discovered by default, but explicit is clearer)
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
