import puppeteer from 'puppeteer';

const DEFAULT_PDF_MARGIN = '16mm';

export const renderHtmlToPdf = async (html: string): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: true,
    ...(process.env.PUPPETEER_EXECUTABLE_PATH
      ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
      : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: DEFAULT_PDF_MARGIN,
        right: DEFAULT_PDF_MARGIN,
        bottom: DEFAULT_PDF_MARGIN,
        left: DEFAULT_PDF_MARGIN,
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
};

export const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const sanitizeHtmlForPdf = (html: string): string =>
  html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '');
