import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, useTheme } from '@mui/material';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { TimeFilterPreset } from '../../types/salesFunnel';

interface TimeFilterSelectorProps {
  selectedPreset: TimeFilterPreset;
  onPresetChange: (preset: TimeFilterPreset) => void;
}

export const TimeFilterSelector: React.FC<TimeFilterSelectorProps> = ({
  selectedPreset,
  onPresetChange,
}) => {
  const theme = useTheme();
  const { isMobile } = useResponsiveLayout();

  const presets: { value: TimeFilterPreset; label: string }[] = [
    { value: 'last7', label: 'Last 7 Days' },
    { value: 'last30', label: 'Last 30 Days' },
    { value: 'last60', label: 'Last 60 Days' },
    { value: 'last90', label: 'Last 90 Days' },
    { value: 'last365', label: 'Last 365 Days' },
    { value: 'allTime', label: 'All Time' },
  ];

  const handleChange = (event: React.MouseEvent<HTMLElement>, newPreset: TimeFilterPreset) => {
    if (newPreset !== null) {
      onPresetChange(newPreset);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <ToggleButtonGroup
        value={selectedPreset}
        exclusive
        onChange={handleChange}
        aria-label="time filter"
        size="small"
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          '& .MuiToggleButton-root': {
            textTransform: 'none',
            fontWeight: 500,
            minWidth: isMobile ? '100px' : '120px',
          },
        }}
      >
        {presets.map((preset) => (
          <ToggleButton
            key={preset.value}
            value={preset.value}
            aria-label={preset.label}
          >
            {preset.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};
