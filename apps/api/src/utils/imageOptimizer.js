import sharp from 'sharp';

export async function optimizeProductImage(buffer) {
  return sharp(buffer)
    .rotate()
    .resize({
      width: 900,
      height: 900,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({
      quality: 88,
      effort: 5,
    })
    .toBuffer();
}