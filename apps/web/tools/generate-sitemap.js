import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

dotenv.config({
  path: path.resolve(process.cwd(), 'apps', 'web', '.env'),
});

const SITE_URL = 'https://mrapexindustrial.in';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;


const makeSlug = (text = '') =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const staticPages = [
  '/',
  '/products',
  '/industries',
  '/brands',
  '/about',
  '/contact',
];

const escapeXml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const buildUrl = (loc) => `  <url>
    <loc>${escapeXml(loc)}</loc>
  </url>`;

const generateSitemap = async () => {
  let productPages = [];

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey
    );

    const { data, error } = await supabase
      .from('products')
      .select('product_name, part_number, slug, status')
      .eq('status', 'Active');

    if (error) {
      console.warn('Product sitemap skipped:', error.message);
    } else {
      productPages = (data || [])
        .map(
          (item) =>
            item.slug ||
            makeSlug(
              `${item.product_name || ''} ${item.part_number || ''}`
            )
        )
        .filter(Boolean)
        .map((slug) => `/products/${slug}`);
    }
  } else {
    console.warn(
      'Supabase env not found. Static sitemap only.'
    );
  }

  const allPages = [...staticPages, ...productPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map((page) => buildUrl(`${SITE_URL}${page}`))
  .join('\n')}
</urlset>
`;

  const outputPath = path.resolve(
  'apps',
  'web',
  'public',
  'sitemap.xml'
);

  fs.writeFileSync(outputPath, xml, 'utf8');

  console.log(
    `sitemap.xml generated successfully with ${allPages.length} URLs`
  );
};

generateSitemap();