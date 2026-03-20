"use client";

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { alpha } from '@mui/material/styles';
import { useAuthStore } from '@/store/auth';
import { useNotificationsStore } from '@/store/notifications';
import {
  MessageSquare, Send, Trash2, MoreVertical, User, Clock, AlertCircle
} from 'lucide-react';

export interface ItemComment {
  id: string;
  itemId: string;
  collection: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  resolved?: boolean;
}

interface ItemCommentsProps {
  comments: ItemComment[];
  onAdd: (content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function ItemComments({ comments, onAdd, onDelete, loading = false }: ItemCommentsProps) {
  const user = useAuthStore((s) => s.user);
  const { addNotification } = useNotificationsStore();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; commentId: string } | null>(null);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onAdd(newComment.trim());
      setNewComment('');
      addNotification({ title: 'Comment Added', message: 'Your comment has been posted.' });
    } catch {
      addNotification({ title: 'Error', message: 'Failed to add comment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setMenuAnchor(null);
    try {
      await onDelete(id);
      addNotification({ title: 'Comment Deleted', message: 'The comment has been removed.' });
    } catch {
      addNotification({ title: 'Error', message: 'Failed to delete comment.' });
    }
  };

  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <MessageSquare size={16} style={{ opacity: 0.6 }} />
        <Typography variant="subtitle2" fontWeight={600}>
          Comments
        </Typography>
        {comments.length > 0 && (
          <Chip label={comments.length} size="small" sx={{ height: 18, fontSize: 11, bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6' }} />
        )}
      </Box>

      {comments.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: '50%',
            bgcolor: alpha('#8B5CF6', 0.08), mb: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MessageSquare size={20} color="#8B5CF6" style={{ opacity: 0.6 }} />
          </Box>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No comments yet.<br />Be the first to comment.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <List dense disablePadding>
            {sortedComments.map((comment, index) => (
              <Box key={comment.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{ px: 2, py: 1.5 }}
                  secondaryAction={
                    user?.id === comment.userId && (
                      <>
                        <IconButton
                          size="small"
                          onClick={(e) => setMenuAnchor({ el: e.currentTarget, commentId: comment.id })}
                        >
                          <MoreVertical size={14} />
                        </IconButton>
                        <Menu
                          anchorEl={menuAnchor?.el}
                          open={menuAnchor?.commentId === comment.id}
                          onClose={() => setMenuAnchor(null)}
                        >
                          <MenuItem onClick={() => handleDelete(comment.id)}>
                            <Trash2 size={14} style={{ marginRight: 8 }} />
                            Delete
                          </MenuItem>
                        </Menu>
                      </>
                    )
                  }
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    {comment.userAvatar ? (
                      <Avatar src={comment.userAvatar} sx={{ width: 28, height: 28 }} />
                    ) : (
                      <Avatar sx={{ width: 28, height: 28, bgcolor: alpha('#8B5CF6', 0.2), fontSize: 12 }}>
                        {comment.userName.charAt(0).toUpperCase()}
                      </Avatar>
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600} fontSize={13}>
                          {comment.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {timeAgo(comment.createdAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" fontSize={13} sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                        {comment.content}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < sortedComments.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Box>
      )}

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: alpha('#8B5CF6', 0.2), fontSize: 12 }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <TextField
              size="small"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              multiline
              maxRows={4}
              fullWidth
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              slotProps={{ input: { sx: { fontSize: 13 } } }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                size="small"
                variant="contained"
                endIcon={<Send size={14} />}
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
                sx={{ borderRadius: '8px' }}
              >
                Post
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
