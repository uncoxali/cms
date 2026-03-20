'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import { useTheme, alpha } from '@mui/material/styles';
import { MessageSquare, Send, Check, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useCommentsStore, type FieldComment } from '@/store/comments';
import { useAuthStore } from '@/store/auth';

interface FieldCommentsProps {
  collection: string;
  itemId: string | number;
  fieldName: string;
  compact?: boolean;
}

export default function FieldComments({ 
  collection, 
  itemId, 
  fieldName,
  compact = false 
}: FieldCommentsProps) {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const { 
    comments, 
    loading, 
    fetchComments, 
    addComment, 
    resolveComment, 
    deleteComment,
    getCommentsForField 
  } = useCommentsStore();
  
  const [expanded, setExpanded] = useState(!compact);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fieldComments = getCommentsForField(collection, itemId, fieldName);
  const unresolvedCount = fieldComments.filter(c => !c.resolved).length;

  useEffect(() => {
    fetchComments(collection, itemId);
  }, [collection, itemId, fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;
    
    setSubmitting(true);
    try {
      await addComment({
        collection,
        itemId,
        fieldName,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        content: newComment.trim(),
        resolved: false,
      });
      setNewComment('');
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (commentId: string, resolved: boolean) => {
    try {
      await resolveComment(commentId, resolved);
    } catch (err) {
      console.error('Failed to resolve comment:', err);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Button
        size="small"
        startIcon={<MessageSquare size={14} />}
        endIcon={unresolvedCount > 0 ? (
          <Chip 
            label={unresolvedCount} 
            size="small" 
            sx={{ height: 18, fontSize: 10, ml: 0.5 }}
          />
        ) : null}
        onClick={() => setExpanded(!expanded)}
        sx={{ 
          color: 'text.secondary',
          '&:hover': { color: 'primary.main' },
          textTransform: 'none',
        }}
      >
        Comments {expanded ? <ChevronUp size={14} style={{ marginLeft: 4 }} /> : <ChevronDown size={14} style={{ marginLeft: 4 }} />}
      </Button>

      <Collapse in={expanded}>
        <Paper 
          sx={{ 
            mt: 1, 
            p: 2, 
            bgcolor: alpha(theme.palette.background.default, 0.5),
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {loading ? (
            <Typography variant="caption" color="text.secondary">Loading comments...</Typography>
          ) : fieldComments.length === 0 ? (
            <Box sx={{ py: 2, textAlign: 'center' }}>
              <MessageSquare size={24} color={theme.palette.text.disabled} style={{ marginBottom: 8 }} />
              <Typography variant="body2" color="text.secondary">
                No comments yet. Be the first to add one!
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 300, overflow: 'auto' }}>
              {fieldComments.map((comment) => (
                <Box 
                  key={comment.id}
                  sx={{ 
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: comment.resolved 
                      ? alpha(theme.palette.success.main, 0.05)
                      : alpha(theme.palette.primary.main, 0.03),
                    border: `1px solid ${comment.resolved ? alpha(theme.palette.success.main, 0.2) : theme.palette.divider}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Avatar
                      src={comment.userAvatar}
                      sx={{ width: 28, height: 28, fontSize: 12 }}
                    >
                      {comment.userName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={600} fontSize={13}>
                          {comment.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontSize={11}>
                          {formatTime(comment.timestamp)}
                        </Typography>
                        {comment.resolved && (
                          <Chip 
                            label="Resolved" 
                            size="small" 
                            sx={{ height: 18, fontSize: 10, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" fontSize={13}>
                        {comment.content}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                        {!comment.resolved && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleResolve(comment.id, true)}
                            sx={{ color: 'success.main' }}
                          >
                            <Check size={14} />
                          </IconButton>
                        )}
                        {comment.resolved && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleResolve(comment.id, false)}
                            sx={{ color: 'text.secondary' }}
                          >
                            <X size={14} />
                          </IconButton>
                        )}
                        {user && comment.userId === user.id && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(comment.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Avatar
              src={user?.avatar}
              sx={{ width: 32, height: 32, fontSize: 13 }}
            >
              {user?.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Add a comment..."
                fullWidth
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                multiline
                maxRows={3}
              />
              <IconButton 
                color="primary" 
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
              >
                <Send size={18} />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
}
