/**
 * Image compression utility for reducing file sizes before upload.
 * Uses browser Canvas API for compression.
 */

export interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0.0 to 1.0
    maxSizeMB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    maxSizeMB: 2,
};

/**
 * Compress an image file
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed file (or original if compression isn't beneficial)
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Skip non-image files
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // Skip small files (under 500KB)
    if (file.size < 500 * 1024) {
        return file;
    }

    // Skip SVG files (vector, no need to compress)
    if (file.type === 'image/svg+xml') {
        return file;
    }

    try {
        const bitmap = await createImageBitmap(file);
        
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = bitmap;
        const maxW = opts.maxWidth!;
        const maxH = opts.maxHeight!;

        if (width > maxW || height > maxH) {
            const ratio = Math.min(maxW / width, maxH / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn('Canvas 2D context not available, returning original file');
            return file;
        }

        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        // Convert to blob with quality setting
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = outputType === 'image/jpeg' ? opts.quality : undefined;

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, outputType, quality);
        });

        if (!blob) {
            console.warn('Failed to create compressed blob, returning original file');
            return file;
        }

        // Only use compressed version if it's smaller
        if (blob.size >= file.size) {
            console.log(`Compression skipped: compressed (${formatBytes(blob.size)}) >= original (${formatBytes(file.size)})`);
            return file;
        }

        const compressedFile = new File([blob], file.name, {
            type: outputType,
            lastModified: Date.now(),
        });

        console.log(`Image compressed: ${formatBytes(file.size)} → ${formatBytes(compressedFile.size)} (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`);

        return compressedFile;
    } catch (error) {
        console.error('Image compression failed:', error);
        return file;
    }
}

/**
 * Compress multiple image files
 */
export async function compressImages(
    files: File[],
    options: CompressionOptions = {}
): Promise<File[]> {
    return Promise.all(files.map(file => compressImage(file, options)));
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
