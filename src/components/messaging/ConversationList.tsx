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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#161b22' }}>
      {/* Search */}
      <Box sx={{ p: 1, borderBottom: '1px solid #30363d' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: '#8b949e' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#0d1117',
            },
          }}
        />
      </Box>

      {/* Conversation List */}
      <List sx={{ flex: 1, overflow: 'auto', py: 0, bgcolor: '#161b22' }}>
        {filteredConversations.length === 0 ? (
          <Box p={2} textAlign="center" sx={{ color: '#8b949e' }}>
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
                borderBottom: '1px solid #21262d',
                '&.Mui-selected': {
                  backgroundColor: '#21262d',
                },
                '&:hover': {
                  backgroundColor: '#21262d',
                },
              }}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={conv.unreadCount}
                  color="primary"
                  invisible={conv.unreadCount === 0}
                >
                  <Avatar sx={{ bgcolor: '#30363d', color: '#8b949e' }}>
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
                      sx={{ maxWidth: isMobile ? 120 : 150, color: '#f0f6fc' }}
                    >
                      {conv.displayName || conv.phoneNumber}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e' }}>
                      {formatTime(conv.lastMessageAt)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography
                    variant="body2"
                    noWrap
                    fontWeight={conv.unreadCount > 0 ? 500 : 400}
                    sx={{ color: '#8b949e' }}
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
                    color: '#8b949e',
                    '&:hover': {
                      color: '#4ade80',
                      backgroundColor: 'rgba(74, 222, 128, 0.15)',
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
