import React from 'react';
import { Chip } from '@mui/material';

interface TemplateChipProps {
  label: string;
  onClick: () => void;
  selected?: boolean;
}

/**
 * TemplateChip - Clickable chip for quick message template selection
 */
export const TemplateChip: React.FC<TemplateChipProps> = ({ label, onClick, selected = false }) => {
  return (
    <Chip
      label={label}
      onClick={onClick}
      size="small"
      sx={{
        bgcolor: selected ? 'rgba(74, 222, 128, 0.2)' : '#21262d',
        color: selected ? '#4ade80' : '#8b949e',
        border: selected ? '1px solid #4ade80' : '1px solid #30363d',
        fontWeight: 500,
        fontSize: '0.7rem',
        height: 26,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          bgcolor: 'rgba(74, 222, 128, 0.15)',
          color: '#4ade80',
          borderColor: '#4ade80',
        },
      }}
    />
  );
};

export default TemplateChip;
