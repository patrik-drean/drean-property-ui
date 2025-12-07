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
} from '@mui/material';
import { Search as SearchIcon, Person as PersonIcon } from '@mui/icons-material';
import { SmsConversation } from '../../types/sms';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: SmsConversation[];
  selectedId?: string;
  onSelect: (conversation: SmsConversation) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
}) => {
  const [search, setSearch] = React.useState('');

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
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
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
                      sx={{ maxWidth: 150 }}
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
            </ListItemButton>
          ))
        )}
      </List>
    </Box>
  );
};
