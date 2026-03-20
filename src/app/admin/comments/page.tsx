'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { alpha } from '@mui/material/styles';
import { useNotificationsStore } from '@/store/notifications';
import { useActivityStore } from '@/store/activity';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import {
  MessageSquare,
  Send,
  Reply,
  Trash2,
  Edit2,
  Flag,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  MoreVertical,
  Heart,
  ThumbsUp,
  AlertTriangle,
  Archive,
  Pin,
  ChevronDown,
} from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  itemId: string;
  itemName: string;
  collection: string;
  parentId?: string;
  replies?: Comment[];
  reactions: { emoji: string; count: number; users: string[] }[];
  mentionedUsers: string[];
  status: 'active' | 'resolved' | 'archived' | 'flagged';
  pinned: boolean;
  edited: boolean;
  dateCreated: string;
  dateUpdated?: string;
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    content: 'The new dashboard design looks great! I especially like the color scheme and the layout of the stats cards.',
    author: { id: '1', name: 'Sarah Chen', avatar: 'SC' },
    itemId: '1',
    itemName: 'Dashboard Redesign',
    collection: 'projects',
    reactions: [
      { emoji: '👍', count: 5, users: ['1', '2', '3'] },
      { emoji: '❤️', count: 3, users: ['4', '5'] },
    ],
    mentionedUsers: [],
    status: 'active',
    pinned: true,
    edited: false,
    dateCreated: '2024-03-15T10:30:00Z',
  },
  {
    id: '2',
    content: 'Can we add more filtering options to the content list? The current implementation is a bit limited.',
    author: { id: '2', name: 'Mike Johnson', avatar: 'MJ' },
    itemId: '2',
    itemName: 'Content List View',
    collection: 'features',
    reactions: [{ emoji: '👍', count: 2, users: ['1'] }],
    mentionedUsers: [],
    status: 'active',
    pinned: false,
    edited: false,
    dateCreated: '2024-03-14T14:20:00Z',
  },
  {
    id: '3',
    content: '@Sarah Chen I agree! The new filtering system is much better. What do you think about adding a date range filter?',
    author: { id: '3', name: 'Alex Kim', avatar: 'AK' },
    itemId: '2',
    itemName: 'Content List View',
    collection: 'features',
    parentId: '2',
    reactions: [],
    mentionedUsers: ['1'],
    status: 'active',
    pinned: false,
    edited: false,
    dateCreated: '2024-03-14T15:00:00Z',
  },
  {
    id: '4',
    content: 'This needs to be fixed urgently. The API response time is too slow for production use.',
    author: { id: '4', name: 'David Lee', avatar: 'DL' },
    itemId: '3',
    itemName: 'API Performance Issue',
    collection: 'bugs',
    reactions: [{ emoji: '😟', count: 4, users: ['1', '2', '3', '5'] }],
    mentionedUsers: [],
    status: 'flagged',
    pinned: false,
    edited: false,
    dateCreated: '2024-03-13T09:15:00Z',
  },
  {
    id: '5',
    content: 'Resolved - the database indexing was the issue. Now responding in under 100ms.',
    author: { id: '1', name: 'Sarah Chen', avatar: 'SC' },
    itemId: '3',
    itemName: 'API Performance Issue',
    collection: 'bugs',
    parentId: '4',
    reactions: [{ emoji: '🎉', count: 3, users: ['2', '3', '4'] }],
    mentionedUsers: [],
    status: 'resolved',
    pinned: false,
    edited: false,
    dateCreated: '2024-03-13T16:45:00Z',
  },
  {
    id: '6',
    content: 'Great progress on the user management module! Just a few minor UI polish items needed.',
    author: { id: '5', name: 'Emma Wilson', avatar: 'EW' },
    itemId: '4',
    itemName: 'User Management Module',
    collection: 'features',
    reactions: [{ emoji: '👍', count: 1, users: ['1'] }],
    mentionedUsers: [],
    status: 'active',
    pinned: false,
    edited: true,
    dateUpdated: '2024-03-12T11:30:00Z',
    dateCreated: '2024-03-12T11:00:00Z',
  },
];

export default function CommentsPage() {
  const { addNotification } = useNotificationsStore();
  const { addLog } = useActivityStore();
  const confirm = useConfirm();

  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [commentText, setCommentText] = useState('');
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'thread'>('list');

  const filteredComments = comments.filter(c => {
    if (c.parentId) return false;
    const matchSearch = !search || 
      c.content.toLowerCase().includes(search.toLowerCase()) ||
      c.author.name.toLowerCase().includes(search.toLowerCase()) ||
      c.itemName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchCollection = collectionFilter === 'all' || c.collection === collectionFilter;
    return matchSearch && matchStatus && matchCollection;
  });

  const collections = [...new Set(comments.map(c => c.collection))];

  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  const toggleExpand = (commentId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleAddReaction = (commentId: string, emoji: string) => {
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      const existingReaction = c.reactions.find(r => r.emoji === emoji);
      if (existingReaction) {
        return {
          ...c,
          reactions: c.reactions.map(r => 
            r.emoji === emoji 
              ? { ...r, count: r.count + 1, users: [...r.users, 'current_user'] }
              : r
          ),
        };
      }
      return {
        ...c,
        reactions: [...c.reactions, { emoji, count: 1, users: ['current_user'] }],
      };
    }));
  };

  const handleStatusChange = (commentId: string, status: Comment['status']) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, status } : c
    ));
    addNotification({ title: 'Status Updated', message: `Comment status changed to ${status}.` });
  };

  const handlePin = (commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, pinned: !c.pinned } : c
    ));
    addNotification({ title: 'Comment Pinned', message: 'Comment has been pinned.' });
  };

  const handleDelete = async (comment: Comment) => {
    const ok = await confirm({
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment?',
      confirmText: 'Delete',
      severity: 'error',
    });
    if (!ok) return;
    setComments(prev => prev.filter(c => c.id !== comment.id && c.parentId !== comment.id));
    addNotification({ title: 'Comment Deleted', message: 'The comment has been deleted.' });
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: 'Delete Comments',
      message: `Are you sure you want to delete ${selectedComments.size} comments?`,
      confirmText: 'Delete All',
      severity: 'error',
    });
    if (!ok) return;
    setComments(prev => prev.filter(c => !selectedComments.has(c.id)));
    setSelectedComments(new Set());
    addNotification({ title: 'Comments Deleted', message: `${selectedComments.size} comments have been deleted.` });
  };

  const handleBulkStatusChange = (status: Comment['status']) => {
    setComments(prev => prev.map(c => 
      selectedComments.has(c.id) ? { ...c, status } : c
    ));
    addNotification({ title: 'Status Updated', message: `${selectedComments.size} comments updated.` });
    setSelectedComments(new Set());
  };

  const handleOpenReply = (comment: Comment) => {
    setReplyTo(comment);
    setReplyDialogOpen(true);
  };

  const handleOpenEdit = (comment: Comment) => {
    setEditingComment(comment);
    setCommentText(comment.content);
    setReplyDialogOpen(true);
  };

  const handleSaveComment = () => {
    if (!commentText.trim()) {
      addNotification({ title: 'Error', message: 'Comment cannot be empty.' });
      return;
    }

    if (editingComment) {
      setComments(prev => prev.map(c => 
        c.id === editingComment.id 
          ? { ...c, content: commentText, edited: true, dateUpdated: new Date().toISOString() }
          : c
      ));
      addNotification({ title: 'Comment Updated', message: 'Your changes have been saved.' });
    } else if (replyTo) {
      const newComment: Comment = {
        id: Date.now().toString(),
        content: commentText,
        author: { id: 'current', name: 'Current User', avatar: 'CU' },
        itemId: replyTo.itemId,
        itemName: replyTo.itemName,
        collection: replyTo.collection,
        parentId: replyTo.id,
        reactions: [],
        mentionedUsers: [],
        status: 'active',
        pinned: false,
        edited: false,
        dateCreated: new Date().toISOString(),
      };
      setComments(prev => [...prev, newComment]);
      addNotification({ title: 'Reply Posted', message: 'Your reply has been posted.' });
    }

    setReplyDialogOpen(false);
    setReplyTo(null);
    setEditingComment(null);
    setCommentText('');
  };

  const toggleSelect = (commentId: string) => {
    setSelectedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const getStatusChip = (status: Comment['status']) => {
    const configs: Record<Comment['status'], { color: 'success' | 'warning' | 'error' | 'default'; icon: typeof CheckCircle; label: string }> = {
      active: { color: 'success', icon: CheckCircle, label: 'Active' },
      resolved: { color: 'default', icon: CheckCircle, label: 'Resolved' },
      archived: { color: 'default', icon: Archive, label: 'Archived' },
      flagged: { color: 'error', icon: Flag, label: 'Flagged' },
    };
    return configs[status];
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const renderComment = (comment: Comment, depth = 0) => {
    const replies = getReplies(comment.id);
    const isExpanded = expandedComments.has(comment.id);
    const statusConfig = getStatusChip(comment.status);

    return (
      <Box key={comment.id} sx={{ ml: depth * 4 }}>
        <Paper
          variant='outlined'
          sx={{
            p: 2,
            mb: 1,
            borderLeft: depth > 0 ? `3px solid ${alpha('#8B5CF6', 0.3)}` : undefined,
            bgcolor: comment.pinned ? alpha('#8B5CF6', 0.05) : 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Checkbox
              checked={selectedComments.has(comment.id)}
              onChange={() => toggleSelect(comment.id)}
              sx={{ mt: -0.5 }}
            />
            
            <Avatar sx={{ width: 36, height: 36, fontSize: 14, bgcolor: alpha('#8B5CF6', 0.2), color: '#8B5CF6' }}>
              {comment.author.avatar}
            </Avatar>
            
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant='subtitle2' fontWeight={700}>
                  {comment.author.name}
                </Typography>
                {comment.pinned && (
                  <Tooltip title='Pinned'>
                    <Pin size={14} color='#8B5CF6' />
                  </Tooltip>
                )}
                {comment.edited && (
                  <Typography variant='caption' color='text.disabled'>(edited)</Typography>
                )}
                <Chip
                  size='small'
                  icon={<statusConfig.icon size={12} />}
                  label={statusConfig.label}
                  color={statusConfig.color}
                  sx={{ height: 20, fontSize: 11 }}
                />
              </Box>

              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
                on <strong>{comment.itemName}</strong> · {formatDate(comment.dateCreated)}
              </Typography>

              <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                {comment.content}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                {['👍', '❤️', '😟', '🎉'].map(emoji => {
                  const reaction = comment.reactions.find(r => r.emoji === emoji);
                  return (
                    <Tooltip key={emoji} title={reaction?.users.join(', ') || emoji}>
                      <Chip
                        size='small'
                        label={`${emoji} ${reaction?.count || ''}`}
                        onClick={() => handleAddReaction(comment.id, emoji)}
                        sx={{ cursor: 'pointer', height: 24 }}
                      />
                    </Tooltip>
                  );
                })}

                <Box sx={{ flexGrow: 1 }} />

                <Tooltip title='Reply'>
                  <IconButton size='small' onClick={() => handleOpenReply(comment)}>
                    <Reply size={14} />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Edit'>
                  <IconButton size='small' onClick={() => handleOpenEdit(comment)}>
                    <Edit2 size={14} />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Delete'>
                  <IconButton size='small' color='error' onClick={() => handleDelete(comment)}>
                    <Trash2 size={14} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={comment.pinned ? 'Unpin' : 'Pin'}>
                  <IconButton size='small' onClick={() => handlePin(comment.id)}>
                    <Pin size={14} />
                  </IconButton>
                </Tooltip>

                {replies.length > 0 && (
                  <Button
                    size='small'
                    endIcon={<ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : undefined }} />}
                    onClick={() => toggleExpand(comment.id)}
                  >
                    {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>

        {isExpanded && replies.map(reply => renderComment(reply, depth + 1))}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant='h5' fontWeight={700}>
              Comments
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Manage and review all comments across the system
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              size='small'
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            <Button
              variant={viewMode === 'thread' ? 'contained' : 'outlined'}
              size='small'
              onClick={() => setViewMode('thread')}
            >
              Thread
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size='small'
            placeholder='Search comments...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8 }} /> }}
            sx={{ width: 280 }}
          />
          <TextField
            select
            size='small'
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ width: 150 }}
          >
            <MenuItem value='all'>All Status</MenuItem>
            <MenuItem value='active'>Active</MenuItem>
            <MenuItem value='resolved'>Resolved</MenuItem>
            <MenuItem value='archived'>Archived</MenuItem>
            <MenuItem value='flagged'>Flagged</MenuItem>
          </TextField>
          <TextField
            select
            size='small'
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            sx={{ width: 180 }}
          >
            <MenuItem value='all'>All Collections</MenuItem>
            {collections.map(c => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
        </Box>

        {selectedComments.size > 0 && (
          <Box sx={{ display: 'flex', gap: 2, mt: 2, p: 2, bgcolor: alpha('#8B5CF6', 0.1), borderRadius: 1 }}>
            <Typography variant='body2' fontWeight={600}>
              {selectedComments.size} selected
            </Typography>
            <Button size='small' onClick={() => handleBulkStatusChange('resolved')}>Mark Resolved</Button>
            <Button size='small' onClick={() => handleBulkStatusChange('archived')}>Archive</Button>
            <Button size='small' color='error' onClick={handleBulkDelete}>Delete</Button>
            <Button size='small' onClick={() => setSelectedComments(new Set())}>Clear</Button>
          </Box>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
        {filteredComments.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <Typography variant='h6' color='text.secondary'>
              No comments found
            </Typography>
            <Typography variant='body2' color='text.disabled'>
              {search ? 'Try a different search term' : 'No comments match your filters'}
            </Typography>
          </Paper>
        ) : (
          filteredComments
            .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
            .map(comment => renderComment(comment))
        )}
      </Box>

      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          {editingComment ? 'Edit Comment' : `Reply to ${replyTo?.author.name}`}
        </DialogTitle>
        <DialogContent>
          {replyTo && !editingComment && (
            <Paper variant='outlined' sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant='body2' color='text.secondary'>
                {replyTo.content.substring(0, 100)}...
              </Typography>
            </Paper>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder='Write your comment...'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleSaveComment} startIcon={<Send size={16} />}>
            {editingComment ? 'Save' : 'Post Reply'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function Checkbox({ checked, onChange, sx }: { checked: boolean; onChange: () => void; sx?: object }) {
  return (
    <Box
      onClick={onChange}
      sx={{
        width: 18,
        height: 18,
        borderRadius: 0.5,
        border: 2,
        borderColor: checked ? 'primary.main' : 'divider',
        bgcolor: checked ? 'primary.main' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 150ms',
        ...sx,
      }}
    >
      {checked && <CheckCircle size={14} color='white' />}
    </Box>
  );
}
