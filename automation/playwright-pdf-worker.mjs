import http from 'node:http';
import { URL } from 'node:url';
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 3100);
const WORKER_SECRET = process.env.WORKER_SECRET || process.env.ONECREATIVA_WEBHOOK_SECRET || 'CREATIVA_SYNC_SECRET_2026';
const ALLOWED_ORIGINS = (process.env.ALLOWED_RENDER_ORIGINS || 'https://one.creativabridging.com,http://localhost,http://127.0.0.1')
  .split(',')
  .map((s) => s.trim().replace(/\/+$/, ''))
  .filter(Boolean);

let browserPromise = null;

async function getBrowser() {
  if (browserPromise) {
    try {
      const b = await browserPromise;
      if (b.isConnected()) return b;
    } catch {
      browserPromise = null;
    }
  }
  browserPromise = chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  return browserPromise;
}

function isAllowedTargetUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    return ALLOWED_ORIGINS.some((origin) => {
      try {
        const o = new URL(origin);
        return parsed.protocol === o.protocol && parsed.hostname === o.hostname;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 2 * 1024 * 1024) {
        reject(new Error('Payload terlalu besar (maks 2 MB).'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8').trim();
        resolve(text ? JSON.parse(text) : {});
      } catch {
        reject(new Error('Body JSON tidak valid.'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function handleRenderPdf(req, res, reqUrl, docKind = 'invoice') {
  const providedSecret = String(req.headers['x-worker-secret'] || req.headers['x-webhook-secret'] || '');
  if (WORKER_SECRET && providedSecret !== WORKER_SECRET) {
    return sendJson(res, 401, { status: 'error', message: 'Unauthorized worker secret.' });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return sendJson(res, 400, { status: 'error', message: err.message });
  }

  const resolvedKind = String(body.document_type || docKind).toLowerCase() === 'receipt' ? 'receipt' : 'invoice';
  const rawDocId = resolvedKind === 'receipt'
    ? (body.receipt_number || body.receipt_id || body.invoice_id || body.id || 'RECEIPT')
    : (body.invoice_id || body.id || 'INVOICE');
  const docId = String(rawDocId).replace(/[^a-zA-Z0-9_-]/g, '');

  const rawTargetUrl = resolvedKind === 'receipt'
    ? (body.receipt_url || body.receipt_pdf_render_url || body.document_url || body.invoice_url || '')
    : (body.invoice_url || body.pdf_render_url || body.document_url || '');
  const baseUrl = String(rawTargetUrl).replace(/([&?])print=1(&|$)/, '$1').replace(/[?&]$/, '');

  if (!baseUrl || !isAllowedTargetUrl(baseUrl)) {
    return sendJson(res, 400, {
      status: 'error',
      message: 'URL dokumen tidak valid atau domain tidak terdaftar di ALLOWED_RENDER_ORIGINS.',
    });
  }

  let context;
  try {
    const browser = await getBrowser();
    context = await browser.newContext({ viewport: { width: 1240, height: 1754 } });
    const page = await context.newPage();

    // Hindari dialog window.print() agar headless PDF tidak terblokir
    await page.addInitScript(() => {
      window.print = () => { };
    });

    const response = await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    if (!response?.ok()) throw new Error('Dokumen invoice resmi tidak tersedia.');
    await page.waitForSelector('.sheet', { timeout: 10000 });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.emulateMedia({ media: 'print' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '14mm', bottom: '14mm', left: '14mm' },
    });

    const prefix = resolvedKind === 'receipt' ? 'RECEIPT' : 'INVOICE';
    const filename = `${prefix}-${docId}.pdf`;
    const outputFormat = reqUrl.searchParams.get('format') || body.format || 'json';

    if (outputFormat === 'binary') {
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length,
      });
      return res.end(pdfBuffer);
    }

    return sendJson(res, 200, {
      status: 'success',
      document_type: resolvedKind,
      document_id: docId,
      invoice_id: String(body.invoice_id || docId),
      filename,
      mimeType: 'application/pdf',
      sizeBytes: pdfBuffer.length,
      pdfBase64: pdfBuffer.toString('base64'),
    });
  } catch {
    console.error('Playwright document render failed. Check worker availability and document access.');
    return sendJson(res, 500, {
      status: 'error',
      message: 'Gagal merender PDF via Playwright. Periksa ketersediaan dokumen resmi dan worker.',
    });
  } finally {
    if (context) {
      await context.close().catch(() => { });
    }
  }
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && reqUrl.pathname === '/health') {
    return sendJson(res, 200, {
      status: 'online',
      service: 'Playwright PDF Invoice & Receipt Worker (Fase 1 & 2)',
      endpoints: ['/render-invoice-pdf', '/render-receipt-pdf', '/render-document-pdf'],
      allowedOrigins: ALLOWED_ORIGINS,
    });
  }

  if (req.method === 'POST' && reqUrl.pathname === '/render-invoice-pdf') {
    return handleRenderPdf(req, res, reqUrl, 'invoice');
  }

  if (req.method === 'POST' && reqUrl.pathname === '/render-receipt-pdf') {
    return handleRenderPdf(req, res, reqUrl, 'receipt');
  }

  if (req.method === 'POST' && reqUrl.pathname === '/render-document-pdf') {
    return handleRenderPdf(req, res, reqUrl, 'invoice');
  }

  return sendJson(res, 404, { status: 'error', message: 'Endpoint tidak ditemukan.' });
});

server.listen(PORT, () => {
  console.log(`[OneCreativa Playwright Worker] Ready on http://localhost:${PORT}`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    if (browserPromise) {
      const b = await browserPromise.catch(() => null);
      if (b) await b.close().catch(() => { });
    }
    server.close(() => process.exit(0));
  });
}
