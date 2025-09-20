export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Krushi",
    "description": "Harness the power of your daily effort with Krushi, the minimalist app designed to help you focus on what truly matters: consistent progress.",
    "url": "https://krushi-beta.vercel.app", // Replace with your actual domain
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Daily effort tracking",
      "Minimalist task management",
      "Progress visualization",
      "Consistent habit building",
      "Focus-oriented design",
      "Dark/Light theme switching",
      "Local storage persistence",
      "Responsive design"
    ],
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "1.0.0",
    "author": {
      "@type": "Organization",
      "name": "Krushi"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}