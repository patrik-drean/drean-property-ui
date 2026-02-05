import React, { useCallback, useRef } from 'react';
import Lightbox, { SlideImage } from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Download from 'yet-another-react-lightbox/plugins/download';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

export interface PhotoGalleryLightboxProps {
  /** Array of photo URLs to display */
  photos: string[];
  /** Whether the lightbox is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Initial photo index to display (default: 0) */
  initialIndex?: number;
}

/**
 * PhotoGalleryLightbox - A fullscreen carousel lightbox for viewing property photos.
 *
 * Features:
 * - Carousel navigation (one photo at a time)
 * - Keyboard navigation (arrow keys, Escape to close)
 * - Photo counter (e.g., "3 of 12")
 * - Thumbnail strip below main image
 * - Download button for saving photos
 * - Zoom support (click to zoom, scroll to zoom)
 *
 * Uses yet-another-react-lightbox library with Counter, Thumbnails, Download, and Zoom plugins.
 */
export const PhotoGalleryLightbox: React.FC<PhotoGalleryLightboxProps> = ({
  photos,
  open,
  onClose,
  initialIndex = 0,
}) => {
  // Track current slide index for download filename
  const currentIndexRef = useRef(initialIndex);

  // Convert photo URLs to lightbox slide format
  const slides: SlideImage[] = photos.map((url) => ({
    src: url,
  }));

  // Custom download function to handle CORS issues with external images
  const handleDownload = useCallback(async ({ slide }: { slide: { src: string } }) => {
    try {
      // Fetch the image as a blob to avoid CORS issues
      const response = await fetch(slide.src);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      const blob = await response.blob();

      // Create a download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `property-photo-${currentIndexRef.current + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      // If fetch fails (CORS), try opening in new tab as fallback
      console.warn('Failed to download image, opening in new tab:', error);
      window.open(slide.src, '_blank');
    }
  }, []);

  // Don't render if no photos
  if (photos.length === 0) {
    return null;
  }

  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={slides}
      plugins={[Counter, Thumbnails, Download, Zoom]}
      counter={{ container: { style: { top: 16, left: 16, right: 'unset', fontSize: '16px' } } }}
      thumbnails={{
        position: 'bottom',
        width: 100,
        height: 75,
        gap: 12,
        padding: 12,
        borderRadius: 4,
      }}
      download={{
        download: handleDownload,
      }}
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true,
      }}
      carousel={{
        finite: false,
        preload: 3,
        padding: '16px',
        spacing: '20%',
      }}
      animation={{
        fade: 250,
        swipe: 250,
      }}
      controller={{
        closeOnBackdropClick: true,
      }}
      render={{
        buttonPrev: photos.length <= 1 ? () => null : undefined,
        buttonNext: photos.length <= 1 ? () => null : undefined,
      }}
      on={{
        view: ({ index }) => {
          currentIndexRef.current = index;
        },
      }}
      styles={{
        container: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
        },
        slide: {
          padding: '48px',
        },
        thumbnailsContainer: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '8px 0',
        },
        thumbnail: {
          border: '2px solid transparent',
        },
      }}
    />
  );
};

export default PhotoGalleryLightbox;
