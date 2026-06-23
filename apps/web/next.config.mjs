import bundleAnalyzer from '@next/bundle-analyzer';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  transpilePackages: ['@metaboost/ui'],
  async rewrites() {
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    const apiOrigin = process.env.WEB_DEV_API_PROXY_TARGET?.trim() || 'http://localhost:4000';
    const base = apiOrigin.replace(/\/$/, '');
    return [
      {
        source: '/v1/:path*',
        destination: `${base}/v1/:path*`,
      },
    ];
  },
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
