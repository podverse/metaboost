import bundleAnalyzer from '@next/bundle-analyzer';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  transpilePackages: ['@boilerplate/ui'],
  async headers() {
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/:path*',
          headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
        },
      ];
    }
    return [];
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
