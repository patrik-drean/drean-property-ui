import React from 'react';
import { Button, Tooltip, IconButton } from '@mui/material';
import { Sms as SmsIcon } from '@mui/icons-material';
import { PropertyLead } from '../../types/property';
import { useMessagingPopover } from '../../contexts/MessagingPopoverContext';

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
  const { openPopover } = useMessagingPopover();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.sellerPhone) {
      // Open messaging popover with phone number, lead ID, and lead data for templates
      openPopover({
        phoneNumber: lead.sellerPhone,
        leadId: lead.id,
        leadName: lead.address, // PropertyLead only has address, not a separate name
        leadAddress: lead.address,
        leadPrice: lead.listingPrice?.toString(),
      });
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
