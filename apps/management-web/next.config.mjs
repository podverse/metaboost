import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const managementApiBackend = process.env.MANAGEMENT_API_SERVER_BASE_URL ?? 'http://localhost:4100';

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/management/v1/:path*',
        destination: `${managementApiBackend}/v1/:path*`,
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

export default withNextIntl(nextConfig);
