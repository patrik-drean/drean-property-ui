import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tooltip, IconButton } from '@mui/material';
import { Sms as SmsIcon } from '@mui/icons-material';
import { PropertyLead } from '../../types/property';

interface MessageLeadButtonProps {
  lead: PropertyLead;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  iconOnly?: boolean;
}

export const MessageLeadButton: React.FC<MessageLeadButtonProps> = ({
  lead,
  variant = 'outlined',
  size = 'small',
  iconOnly = false,
}) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.sellerPhone) {
      // Navigate to messaging with phone number and lead ID
      navigate(`/messaging?phone=${encodeURIComponent(lead.sellerPhone)}&lead=${lead.id}`);
    }
  };

  if (!lead.sellerPhone) {
    return iconOnly ? (
      <Tooltip title="No phone number available">
        <span>
          <IconButton size={size} disabled>
            <SmsIcon fontSize={size} />
          </IconButton>
        </span>
      </Tooltip>
    ) : (
      <Tooltip title="No phone number available">
        <span>
          <Button
            variant={variant}
            size={size}
            startIcon={<SmsIcon />}
            disabled
          >
            Message
          </Button>
        </span>
      </Tooltip>
    );
  }

  return iconOnly ? (
    <Tooltip title="Send SMS Message">
      <IconButton size={size} onClick={handleClick} color="primary">
        <SmsIcon fontSize={size} />
      </IconButton>
    </Tooltip>
  ) : (
    <Button
      variant={variant}
      size={size}
      startIcon={<SmsIcon />}
      onClick={handleClick}
    >
      Message
    </Button>
  );
};
