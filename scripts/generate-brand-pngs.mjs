/**
 * Generate PNG variants of all SVG brand assets using macOS sips + rsvg-convert.
 * Falls back to qlmanage if rsvg not available.
 * Also creates a ZIP bundle.
 *
 * Usage: node scripts/generate-brand-pngs.mjs
 */
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

const BRAND_DIR = join(process.cwd(), 'public/assets/brand');

function svgToPng(svgPath, pngPath, scale = 1) {
  // Use qlmanage (macOS built-in) for conversion
  try {
    // Get SVG dimensions
    const svg = execSync(`cat "${svgPath}"`, { encoding: 'utf8' });
    const wMatch = svg.match(/width="(\d+)"/);
    const hMatch = svg.match(/height="(\d+)"/);
    const w = wMatch ? parseInt(wMatch[1]) * scale : 400;
    const h = hMatch ? parseInt(hMatch[1]) * scale : 100;

    // Try rsvg-convert first (best quality)
    try {
      execSync(`rsvg-convert -w ${w} -h ${h} "${svgPath}" -o "${pngPath}" 2>/dev/null`);
      return true;
    } catch {}

    // Fallback: use qlmanage
    const tmpDir = '/tmp/brand-png-gen';
    execSync(`mkdir -p ${tmpDir}`);
    execSync(`qlmanage -t -s ${Math.max(w, h)} -o ${tmpDir} "${svgPath}" 2>/dev/null`);
    const generatedFile = execSync(`ls "${tmpDir}"`, { encoding: 'utf8' }).trim().split('\n')[0];
    if (generatedFile) {
      execSync(`mv "${tmpDir}/${generatedFile}" "${pngPath}"`);
      execSync(`sips -z ${h} ${w} "${pngPath}" 2>/dev/null`);
    }
    execSync(`rm -rf ${tmpDir}`);
    return true;
  } catch (e) {
    console.error(`  Failed: ${e.message}`);
    return false;
  }
}

async function main() {
  const files = await readdir(BRAND_DIR);
  const svgFiles = files.filter(f => f.startsWith('3box-') && f.endsWith('.svg'));

  console.log(`Found ${svgFiles.length} SVG files to convert:\n`);

  for (const svgFile of svgFiles) {
    const svgPath = join(BRAND_DIR, svgFile);
    const baseName = svgFile.replace('.svg', '');

    // 1x PNG
    const ok1 = svgToPng(svgPath, join(BRAND_DIR, `${baseName}.png`), 1);
    // 2x PNG
    const ok2 = svgToPng(svgPath, join(BRAND_DIR, `${baseName}@2x.png`), 2);

    console.log(`  ${baseName}: 1x=${ok1 ? 'ok' : 'fail'} 2x=${ok2 ? 'ok' : 'fail'}`);
  }

  // Create ZIP
  console.log('\nCreating ZIP bundle...');
  const allFiles = await readdir(BRAND_DIR);
  const brandFiles = allFiles.filter(f => f.startsWith('3box-')).sort();
  const fileList = brandFiles.join(' ');
  execSync(`cd "${BRAND_DIR}" && zip -q -o 3box-brand-kit.zip ${fileList}`);
  console.log(`  3box-brand-kit.zip (${brandFiles.length} files)`);
  console.log('\nDone!');
}

main().catch(console.error);
