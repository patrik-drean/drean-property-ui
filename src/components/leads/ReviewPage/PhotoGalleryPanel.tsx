import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, IconButton, CircularProgress, Tooltip } from '@mui/material';
import {
  Close as CloseIcon,
  KeyboardArrowLeft as PrevIcon,
  KeyboardArrowRight as NextIcon,
  Download as DownloadIcon,
  FolderZip as FolderZipIcon,
} from '@mui/icons-material';
import JSZip from 'jszip';
import { QueueLead } from '../../../types/queue';
import { GradeBadge } from '../DetailPanel/GradeBadge';

interface PhotoGalleryPanelProps {
  lead: QueueLead;
  onClose: () => void;
}

/**
 * PhotoGalleryPanel - Full-height panel showing property photos
 * Displays on the left side of the screen when viewing photos from detail panel
 */
export const PhotoGalleryPanel: React.FC<PhotoGalleryPanelProps> = ({
  lead,
  onClose,
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isZipping, setIsZipping] = useState(false);

  // Get all photos
  const allPhotos = lead.photoUrls?.length ? lead.photoUrls : (lead.photoUrl ? [lead.photoUrl] : []);

  // Reset photo index when lead changes
  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [lead.id]);

  // Navigate photos
  const goToPrevPhoto = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1));
  }, [allPhotos.length]);

  const goToNextPhoto = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0));
  }, [allPhotos.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        goToPrevPhoto();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        goToNextPhoto();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [goToPrevPhoto, goToNextPhoto, onClose]);

  // Download current photo
  const handleDownload = async () => {
    if (allPhotos.length === 0) return;
    const url = allPhotos[currentPhotoIndex];
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `property-photo-${currentPhotoIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      window.open(url, '_blank');
    }
  };

  // Download all photos as zip
  const handleDownloadAll = async () => {
    if (allPhotos.length === 0 || isZipping) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const results = await Promise.allSettled(
        allPhotos.map(async (url, index) => {
          const response = await fetch(url);
          const blob = await response.blob();
          const ext = blob.type === 'image/png' ? 'png' : 'jpg';
          zip.file(`photo-${index + 1}.${ext}`, blob);
        })
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed === allPhotos.length) throw new Error('All downloads failed');

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const slug = lead.address?.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase() || 'property';
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${slug}-photos.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  if (allPhotos.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0d1117',
        borderRight: '1px solid #30363d',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid #21262d',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <Typography sx={{ color: '#f0f6fc', fontWeight: 600, fontSize: '1rem', whiteSpace: 'nowrap' }}>
            {lead.address}
          </Typography>
          {lead.neighborhoodGrade && (
            <GradeBadge grade={lead.neighborhoodGrade} showLabel={false} />
          )}
          <Typography sx={{ color: '#8b949e', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            ${lead.listingPrice?.toLocaleString()}
          </Typography>
          {lead.units != null && (
            <Typography sx={{ color: '#8b949e', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              {lead.units} {lead.units === 1 ? 'unit' : 'units'}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Download current photo" arrow>
            <IconButton
              onClick={handleDownload}
              sx={{ color: '#8b949e', '&:hover': { color: '#f0f6fc' } }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          {allPhotos.length > 1 && (
            <Tooltip title={isZipping ? 'Zipping photos...' : `Download all ${allPhotos.length} photos`} arrow>
              <span>
                <IconButton
                  onClick={handleDownloadAll}
                  disabled={isZipping}
                  sx={{ color: '#8b949e', '&:hover': { color: '#f0f6fc' }, '&.Mui-disabled': { color: '#484f58' } }}
                >
                  {isZipping ? <CircularProgress size={20} sx={{ color: '#8b949e' }} /> : <FolderZipIcon />}
                </IconButton>
              </span>
            </Tooltip>
          )}
          <IconButton
            onClick={onClose}
            sx={{ color: '#8b949e', '&:hover': { color: '#f0f6fc' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Main photo area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          p: 2,
          minHeight: 0,
        }}
      >
        {/* Main image */}
        <Box
          sx={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            component="img"
            src={allPhotos[currentPhotoIndex]}
            alt={`Property photo ${currentPhotoIndex + 1}`}
            sx={{
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 280px)',
              objectFit: 'contain',
              borderRadius: 1,
            }}
          />
        </Box>

        {/* Navigation arrows */}
        {allPhotos.length > 1 && (
          <>
            <IconButton
              onClick={goToPrevPhoto}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                color: '#fff',
                width: 48,
                height: 48,
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
              }}
            >
              <PrevIcon sx={{ fontSize: 32 }} />
            </IconButton>
            <IconButton
              onClick={goToNextPhoto}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                color: '#fff',
                width: 48,
                height: 48,
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
              }}
            >
              <NextIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </>
        )}

        {/* Photo counter */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            px: 3,
            py: 1,
            borderRadius: 2,
          }}
        >
          <Typography sx={{ color: '#fff', fontSize: '1rem', fontWeight: 500 }}>
            {currentPhotoIndex + 1} / {allPhotos.length}
          </Typography>
        </Box>
      </Box>

      {/* Thumbnail strip */}
      {allPhotos.length > 1 && (
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid #21262d',
            bgcolor: '#161b22',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              overflowX: 'auto',
              pb: 1,
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#30363d', borderRadius: 3 },
            }}
          >
            {allPhotos.map((url, index) => (
              <Box
                key={index}
                onClick={() => setCurrentPhotoIndex(index)}
                sx={{
                  width: 100,
                  height: 75,
                  flexShrink: 0,
                  borderRadius: 1,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: index === currentPhotoIndex ? '3px solid #4ade80' : '3px solid transparent',
                  opacity: index === currentPhotoIndex ? 1 : 0.6,
                  transition: 'all 0.2s',
                  '&:hover': { opacity: 1 },
                }}
              >
                <Box
                  component="img"
                  src={url}
                  alt={`Thumbnail ${index + 1}`}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Keyboard hint */}
      <Box sx={{ p: 1.5, textAlign: 'center', borderTop: '1px solid #21262d' }}>
        <Typography sx={{ color: '#484f58', fontSize: '0.75rem' }}>
          ← → Navigate | ESC Close | P Toggle
        </Typography>
      </Box>
    </Box>
  );
};

export default PhotoGalleryPanel;
