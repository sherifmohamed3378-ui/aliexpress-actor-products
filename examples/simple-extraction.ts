/**
 * Simple extraction example
 * Run: npm run dev
 */
import { ProductExtractionEngine } from '../src/index.js';

async function main(): Promise<void> {
  const engine = new ProductExtractionEngine({ confidenceThreshold: 0.3 });

  const html = `
    <html>
      <head><meta property="og:title" content="Wireless Earbuds" /></head>
      <body>
        <h1>Wireless Earbuds Pro Max</h1>
        <script>
          window.runParams = {
            data: {
              productId: "1005006000000000",
              subject: "Wireless Earbuds Pro Max",
              salePrice: { value: 29.99, currency: "USD" },
              imageModule: { imagePathList: ["//ae01.alicdn.com/kf/1.jpg"] },
              tradeModule: { tradeCount: 1500 }
            }
          };
        </script>
      </body>
    </html>
  `;

  const result = await engine.extract({
    url: 'https://www.aliexpress.com/item/1005006000000000.html',
    html,
  });

  console.log('Title:', result.product.title?.value);
  console.log('Price:', result.product.price?.value);
  console.log('Confidence:', result.product.title?.confidence);
  console.log('Sources:', result.performance.sources);
  console.log('Time:', result.performance.totalTimeMs, 'ms');
}

main().catch(console.error);
