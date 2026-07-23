export function normalizeAliExpressUrl(url: string): string {
  // تحويل روابط الأقسام العادية إلى صيغة wholesale الخفيفة المضمونة
  if (url.includes('/category/')) {
    const match = url.match(/\/category\/\d+\/([^.]+)\.html/);
    if (match && match[1]) {
      const categorySlug = match[1];
      return `https://www.aliexpress.com/w/wholesale-${categorySlug}.html`;
    }
  }
  return url;
}