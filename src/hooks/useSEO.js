import { useEffect } from 'react';

const BASE_TITLE = 'ONE Creativa';
const SITE_NAME = 'ONE Creativa — Sistem HRIS PT. Creativa Bridging International';
const BASE_DESCRIPTION = 'Sistem HRIS Terintegrasi untuk PT. Creativa Bridging International. Kelola karyawan, absensi, lembur, dan payroll dengan mudah dan efisien.';

/**
 * useSEO — Hook untuk set document title & meta description per halaman.
 * @param {object} options
 * @param {string} [options.title]       — Judul halaman (tanpa suffix brand)
 * @param {string} [options.description] — Meta description spesifik halaman
 */
export function useSEO({ title, description } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${BASE_TITLE}` : SITE_NAME;
    const metaDesc = description || BASE_DESCRIPTION;

    // Update <title>
    document.title = fullTitle;

    // Update meta description
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) descEl.setAttribute('content', metaDesc);

    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', metaDesc);

    // Update twitter tags
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', fullTitle);

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', metaDesc);

    // Restore on unmount
    return () => {
      document.title = SITE_NAME;
      if (descEl) descEl.setAttribute('content', BASE_DESCRIPTION);
      if (ogTitle) ogTitle.setAttribute('content', `${BASE_TITLE} — Sistem HRIS Terintegrasi`);
      if (ogDesc) ogDesc.setAttribute('content', BASE_DESCRIPTION);
      if (twTitle) twTitle.setAttribute('content', `${BASE_TITLE} — Sistem HRIS Terintegrasi`);
      if (twDesc) twDesc.setAttribute('content', BASE_DESCRIPTION);
    };
  }, [title, description]);
}
