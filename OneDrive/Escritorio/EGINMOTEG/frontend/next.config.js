const withNextIntl = require('next-intl/plugin')();

module.exports = withNextIntl({
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
    ],
  },
  output: 'standalone',
});
