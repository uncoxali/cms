'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Search,
  LayoutDashboard,
  Database,
  FolderOpen,
  Users,
  Settings,
  Activity,
  Globe,
  FileText,
  Plus,
  Upload,
  UserPlus,
  ArrowRight,
  Zap,
  BookOpen,
  Shield,
  Palette,
  Workflow,
  Bookmark,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useSchemaStore } from '@/store/schema';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
  keywords?: string[];
  shortcut?: string[];
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const theme = useTheme();
  const role = useAuthStore((state) => state.role);
  const { collections } = useSchemaStore();

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const openEvent = () => setOpen(true);
    document.addEventListener('keydown', down);
    document.addEventListener('openCommandPalette', openEvent);
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('openCommandPalette', openEvent);
    };
  }, []);

  const commands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      {
        id: 'dashboard',
        label: 'Go to Dashboard',
        icon: LayoutDashboard,
        action: () => router.push('/admin/dashboard'),
        category: 'Navigation',
        shortcut: ['G', 'D'],
      },
      {
        id: 'content',
        label: 'Go to Content',
        icon: Database,
        action: () => router.push('/admin/content'),
        category: 'Navigation',
        shortcut: ['G', 'C'],
      },
      {
        id: 'files',
        label: 'Go to Files',
        icon: FolderOpen,
        action: () => router.push('/admin/files'),
        category: 'Navigation',
        shortcut: ['G', 'F'],
      },
      {
        id: 'users',
        label: 'Go to Users',
        icon: Users,
        action: () => router.push('/admin/users'),
        category: 'Navigation',
        keywords: ['people', 'accounts'],
        shortcut: ['G', 'U'],
      },
      {
        id: 'flows',
        label: 'Go to Flows',
        icon: Workflow,
        action: () => router.push('/admin/flows'),
        category: 'Navigation',
        shortcut: ['G', 'W'],
      },
      {
        id: 'activity',
        label: 'Go to Activity',
        icon: Activity,
        action: () => router.push('/admin/activity'),
        category: 'Navigation',
        shortcut: ['G', 'A'],
      },
      {
        id: 'settings',
        label: 'Go to Settings',
        icon: Settings,
        action: () => router.push('/admin/settings'),
        category: 'Navigation',
        shortcut: ['G', 'S'],
      },
      {
        id: 'data-model',
        label: 'Go to Data Model',
        icon: Database,
        action: () => router.push('/admin/settings/data-model'),
        category: 'Settings',
      },
      {
        id: 'roles',
        label: 'Go to Roles & Permissions',
        icon: Shield,
        action: () => router.push('/admin/settings/roles'),
        category: 'Settings',
      },
      {
        id: 'presets',
        label: 'Go to Presets',
        icon: Bookmark,
        action: () => router.push('/admin/settings/presets'),
        category: 'Settings',
      },
      {
        id: 'extensions',
        label: 'Go to Extensions',
        icon: Zap,
        action: () => router.push('/admin/settings/extensions'),
        category: 'Settings',
      },
      {
        id: 'project-settings',
        label: 'Go to Project Settings',
        icon: Palette,
        action: () => router.push('/admin/settings/project'),
        category: 'Settings',
      },
      {
        id: 'pages',
        label: 'Go to Pages',
        icon: Globe,
        action: () => router.push('/admin/pages'),
        category: 'Navigation',
      },
    ];

    Object.entries(collections).forEach(([key, col]) => {
      items.push({
        id: `content-${key}`,
        label: `Go to ${col.label}`,
        icon: Database,
        action: () => router.push(`/admin/content/${key}`),
        category: 'Collections',
        keywords: [key, col.label],
      });
    });

    if (role === 'admin') {
      items.push(
        {
          id: 'create-collection',
          label: 'Create New Collection',
          icon: Plus,
          action: () => router.push('/admin/settings/data-model?action=create'),
          category: 'Actions',
          shortcut: ['N', 'C'],
        },
        {
          id: 'create-user',
          label: 'Create New User',
          icon: UserPlus,
          action: () => router.push('/admin/users?action=create'),
          category: 'Actions',
        },
        {
          id: 'upload-files',
          label: 'Upload Files',
          icon: Upload,
          action: () => router.push('/admin/files?action=upload'),
          category: 'Actions',
          shortcut: ['U', 'F'],
        },
        {
          id: 'create-flow',
          label: 'Create New Flow',
          icon: Workflow,
          action: () => router.push('/admin/flows?action=create'),
          category: 'Actions',
        }
      );
    }

    return items;
  }, [collections, role, router]);

  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q) ||
        cmd.keywords?.some((k) => k.toLowerCase().includes(q)) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filteredCommands[selectedIndex]?.action();
        handleClose();
      }
    },
    [filteredCommands, selectedIndex, handleClose]
  );

  if (!open) return null;

  let flatIndex = 0;

  return (
    <Box
      onClick={handleClose}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: '15vh',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Paper
        elevation={24}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        sx={{
          width: '100%',
          maxWidth: 600,
          maxHeight: '60vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2.5,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Search size={18} color={theme.palette.text.secondary} />
          <InputBase
            autoFocus
            fullWidth
            placeholder="Search commands, collections, settings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{
              fontSize: 15,
              '& input::placeholder': { color: 'text.secondary', opacity: 0.7 },
            }}
          />
          <Chip
            label="ESC"
            size="small"
            sx={{
              height: 22,
              fontSize: 10,
              fontWeight: 700,
              bgcolor: alpha(theme.palette.text.primary, 0.06),
              color: 'text.secondary',
              borderRadius: '6px',
            }}
          />
        </Box>

        <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
          {filteredCommands.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">No commands found</Typography>
            </Box>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <Box key={category}>
                <Box sx={{ px: 2.5, py: 1, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ letterSpacing: '0.05em', fontSize: 10 }}
                  >
                    {category.toUpperCase()}
                  </Typography>
                </Box>
                <List dense sx={{ py: 0.5 }}>
                  {items.map((cmd) => {
                    const isSelected = flatIndex === selectedIndex;
                    const currentIndex = flatIndex;
                    flatIndex++;
                    return (
                      <ListItem key={cmd.id} disablePadding>
                        <ListItemButton
                          selected={isSelected}
                          onClick={() => {
                            cmd.action();
                            handleClose();
                          }}
                          sx={{
                            borderRadius: '8px',
                            mx: 1,
                            py: 1,
                            '&.Mui-selected': {
                              bgcolor: alpha(theme.palette.primary.main, 0.12),
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '8px',
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <cmd.icon size={14} color={theme.palette.primary.main} />
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={cmd.label}
                            slotProps={{
                              primary: {
                                fontSize: 13,
                                fontWeight: isSelected ? 600 : 400,
                              },
                            }}
                          />
                          {cmd.shortcut && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {cmd.shortcut.map((key, i) => (
                                <Chip
                                  key={i}
                                  label={key}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    bgcolor: alpha(theme.palette.text.primary, 0.06),
                                    '& .MuiChip-label': { px: 0.75 },
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                          {isSelected && (
                            <ChevronRight size={16} color={theme.palette.primary.main} />
                          )}
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            ))
          )}
        </Box>

        <Divider />
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: alpha(theme.palette.background.default, 0.5),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip label="↑" size="small" sx={{ height: 20, fontSize: 11, minWidth: 24 }} />
            <Chip label="↓" size="small" sx={{ height: 20, fontSize: 11, minWidth: 24 }} />
            <Typography variant="caption" color="text.secondary" fontSize={11}>
              Navigate
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip label="↵" size="small" sx={{ height: 20, fontSize: 11, minWidth: 24 }} />
            <Typography variant="caption" color="text.secondary" fontSize={11}>
              Select
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" fontSize={11} sx={{ ml: 'auto' }}>
            {filteredCommands.length} commands
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
