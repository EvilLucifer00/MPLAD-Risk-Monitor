import { describe, it, expect } from 'vitest';
import { compressImageFile, compressFiles } from '../utils/imageCompressor';

describe('imageCompressor Utility', () => {
  it('returns non-image files (e.g. PDF) unchanged', async () => {
    const pdfFile = new File(['%PDF-1.4 sample content'], 'project_estimate.pdf', {
      type: 'application/pdf',
    });

    const result = await compressImageFile(pdfFile);
    expect(result).toBe(pdfFile);
    expect(result.name).toBe('project_estimate.pdf');
  });

  it('bypasses compression if image is below size threshold', async () => {
    const smallImage = new File(['fake-image-bytes'], 'small_site.png', {
      type: 'image/png',
    });

    const result = await compressImageFile(smallImage, { maxBytesToTrigger: 1024 * 1024 });
    expect(result).toBe(smallImage);
  });

  it('compressFiles processes arrays of mixed files safely', async () => {
    const file1 = new File(['data1'], 'doc.pdf', { type: 'application/pdf' });
    const file2 = new File(['data2'], 'photo.png', { type: 'image/png' });

    const results = await compressFiles([file1, file2]);
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('doc.pdf');
    expect(results[1].name).toBe('photo.png');
  });
});

