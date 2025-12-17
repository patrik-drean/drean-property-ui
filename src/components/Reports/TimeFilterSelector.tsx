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
          gap: 0.5,
          '& .MuiToggleButton-root': {
            textTransform: 'none',
            fontWeight: 500,
            minWidth: isMobile ? '100px' : '120px',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            px: 2,
            py: 0.75,
            '&.Mui-selected': {
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              borderColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            },
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
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
