import React from 'react';
import {
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  MarkEmailUnread as MarkUnreadIcon,
} from '@mui/icons-material';
import { SmsConversation } from '../../types/sms';
import { formatMessageTime } from '../../utils/timezone';
import { smsService } from '../../services/smsService';

interface ConversationListProps {
  conversations: SmsConversation[];
  selectedId?: string;
  onSelect: (conversation: SmsConversation) => void;
  onRefresh?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  onRefresh,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [search, setSearch] = React.useState('');
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
    conversationId: string;
  } | null>(null);

  const filteredConversations = conversations.filter((conv) => {
    const searchLower = search.toLowerCase();
    return (
      conv.phoneNumber.includes(search) ||
      conv.displayName?.toLowerCase().includes(searchLower) ||
      conv.lastMessagePreview?.toLowerCase().includes(searchLower)
    );
  });

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return formatMessageTime(dateString);
  };

  const handleContextMenu = (event: React.MouseEvent, conversationId: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      conversationId,
    });
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const handleMarkUnread = async () => {
    if (!contextMenu) return;

    try {
      await smsService.markConversationUnread(contextMenu.conversationId);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to mark conversation as unread:', err);
    } finally {
      handleClose();
    }
  };

  const handleMarkUnreadDirect = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); // Prevent selecting the conversation
    try {
      await smsService.markConversationUnread(conversationId);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to mark conversation as unread:', err);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search */}
      <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Conversation List */}
      <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
        {filteredConversations.length === 0 ? (
          <Box p={2} textAlign="center" color="text.secondary">
            <Typography variant="body2">
              {search ? 'No matching conversations' : 'No conversations yet'}
            </Typography>
          </Box>
        ) : (
          filteredConversations.map((conv) => (
            <ListItemButton
              key={conv.id}
              selected={conv.id === selectedId}
              onClick={() => onSelect(conv)}
              onContextMenu={(e) => handleContextMenu(e, conv.id)}
              sx={{
                borderBottom: '1px solid #f0f0f0',
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                },
              }}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={conv.unreadCount}
                  color="primary"
                  invisible={conv.unreadCount === 0}
                >
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography
                      variant="body1"
                      fontWeight={conv.unreadCount > 0 ? 600 : 400}
                      noWrap
                      sx={{ maxWidth: isMobile ? 120 : 150 }}
                    >
                      {conv.displayName || conv.phoneNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(conv.lastMessageAt)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    fontWeight={conv.unreadCount > 0 ? 500 : 400}
                  >
                    {conv.lastMessagePreview || 'No messages'}
                  </Typography>
                }
              />
              {/* Mobile: Explicit mark as unread button */}
              {isMobile && conv.unreadCount === 0 && (
                <IconButton
                  size="small"
                  onClick={(e) => handleMarkUnreadDirect(e, conv.id)}
                  sx={{
                    ml: 1,
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    },
                  }}
                  aria-label="Mark as unread"
                >
                  <MarkUnreadIcon fontSize="small" />
                </IconButton>
              )}
            </ListItemButton>
          ))
        )}
      </List>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleMarkUnread}>
          <ListItemIcon>
            <MarkUnreadIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Mark as Unread</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};
