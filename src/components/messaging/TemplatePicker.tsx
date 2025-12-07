import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemText,
  Typography,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Description as TemplateIcon } from '@mui/icons-material';
import { smsService } from '../../services/smsService';
import { SmsTemplate, TemplateVariables } from '../../types/sms';

interface TemplatePickerProps {
  variables: TemplateVariables;
  onSelect: (body: string) => void;
  disabled?: boolean;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  variables,
  onSelect,
  disabled = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const open = Boolean(anchorEl);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);

    // Only load templates once
    if (!loaded) {
      setLoading(true);
      try {
        const data = await smsService.getTemplates();
        setTemplates(data);
        setLoaded(true);
      } catch (err) {
        console.error('Failed to load templates:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const substituteVariables = (body: string): string => {
    let result = body;
    Object.entries(variables).forEach(([key, value]) => {
      if (value) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
    });
    return result;
  };

  const handleSelectTemplate = (template: SmsTemplate) => {
    const substitutedBody = substituteVariables(template.body);
    onSelect(substitutedBody);
    handleClose();
  };

  const previewTemplate = (body: string): string => {
    const preview = substituteVariables(body);
    // Truncate for menu display
    return preview.length > 80 ? preview.substring(0, 77) + '...' : preview;
  };

  return (
    <>
      <Button
        size="small"
        startIcon={<TemplateIcon />}
        onClick={handleClick}
        disabled={disabled}
        sx={{ textTransform: 'none' }}
      >
        Templates
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 },
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        {loading ? (
          <Box p={2} display="flex" justifyContent="center">
            <CircularProgress size={24} />
          </Box>
        ) : templates.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No templates available
            </Typography>
          </MenuItem>
        ) : (
          templates.map((template, index) => (
            <React.Fragment key={template.id}>
              <MenuItem onClick={() => handleSelectTemplate(template)} sx={{ py: 1.5 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={500}>
                      {template.name}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        mt: 0.5,
                      }}
                    >
                      {previewTemplate(template.body)}
                    </Typography>
                  }
                />
              </MenuItem>
              {index < templates.length - 1 && <Divider />}
            </React.Fragment>
          ))
        )}
      </Menu>
    </>
  );
};
