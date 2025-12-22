import Script from 'next/script';

export function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TimeSeal',
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Cryptographic time-locked vault with dead man\'s switch. Secure encryption for messages and files that unlock automatically at a future date or after inactivity.',
    featureList: [
      'Time-locked encryption',
      'Dead man\'s switch',
      'AES-GCM encryption',
      'Zero-trust architecture',
      'Split-key cryptography',
      'Cloudflare edge deployment',
      'D1 database storage',
    ],
    screenshot: 'https://timeseal.dev/explainerimage.png',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      ratingCount: '1',
    },
  };

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
