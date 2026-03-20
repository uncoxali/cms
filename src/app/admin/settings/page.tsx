'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Link from 'next/link';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Settings,
  Database,
  Users,
  Shield,
  Zap,
  Mail,
  Globe,
  FileText,
  KeyRound,
  Clock,
  Globe2,
  Puzzle,
  Image,
  Lock,
  Smartphone,
  Hash,
  Palette,
  Bell,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

const SETTINGS_SECTIONS = [
  {
    category: 'Data',
    items: [
      {
        title: 'Data Model',
        description: 'Manage collections, fields, and relations',
        icon: Database,
        path: '/admin/settings/data-model',
        color: '#8B5CF6',
      },
      {
        title: 'Presets',
        description: 'Default layouts and sorting for collections',
        icon: Palette,
        path: '/admin/settings/presets',
        color: '#EC4899',
      },
    ],
  },
  {
    category: 'Access',
    items: [
      {
        title: 'Users',
        description: 'Manage user accounts and permissions',
        icon: Users,
        path: '/admin/settings/users',
        color: '#3B82F6',
      },
      {
        title: 'Roles & Permissions',
        description: 'Define roles and their access levels',
        icon: Shield,
        path: '/admin/settings/roles',
        color: '#10B981',
      },
      {
        title: 'Password Policy',
        description: 'Configure password requirements',
        icon: Lock,
        path: '/admin/settings/password-policy',
        color: '#F59E0B',
      },
      {
        title: 'Two-Factor Auth',
        description: 'Enable and configure 2FA',
        icon: Smartphone,
        path: '/admin/settings/2fa',
        color: '#22C55E',
      },
      {
        title: 'OAuth / SSO',
        description: 'Single sign-on with external providers',
        icon: KeyRound,
        path: '/admin/settings/oauth',
        color: '#6366F1',
      },
      {
        title: 'IP Allowlist',
        description: 'Restrict access by IP address',
        icon: Globe2,
        path: '/admin/settings/ip-allowlist',
        color: '#14B8A6',
      },
      {
        title: 'API Tokens',
        description: 'Manage API access tokens',
        icon: Hash,
        path: '/admin/settings/api-tokens',
        color: '#F97316',
      },
    ],
  },
  {
    category: 'Automation',
    items: [
      {
        title: 'Webhooks',
        description: 'Configure outbound HTTP callbacks',
        icon: Zap,
        path: '/admin/settings/webhooks',
        color: '#EF4444',
      },
      {
        title: 'Flows',
        description: 'Build automated workflows',
        icon: Settings,
        path: '/admin/settings/flows',
        color: '#8B5CF6',
      },
      {
        title: 'Scheduled Tasks',
        description: 'CRON jobs and automation',
        icon: Clock,
        path: '/admin/settings/scheduled-tasks',
        color: '#EC4899',
      },
    ],
  },
  {
    category: 'Content',
    items: [
      {
        title: 'Email Templates',
        description: 'Manage transactional email templates',
        icon: Mail,
        path: '/admin/settings/email-templates',
        color: '#F59E0B',
      },
      {
        title: 'API Documentation',
        description: 'View API docs and authentication',
        icon: BookOpen,
        path: '/admin/settings/api-docs',
        color: '#3B82F6',
      },
      {
        title: 'File Storage',
        description: 'Image transformations and presets',
        icon: Image,
        path: '/admin/settings/file-storage',
        color: '#10B981',
      },
    ],
  },
  {
    category: 'Integrations',
    items: [
      {
        title: 'Extensions',
        description: 'Browse and manage extensions',
        icon: Puzzle,
        path: '/admin/settings/marketplace',
        color: '#8B5CF6',
      },
      {
        title: 'WebSockets',
        description: 'Real-time communication settings',
        icon: Globe,
        path: '/admin/settings/websockets',
        color: '#14B8A6',
      },
    ],
  },
  {
    category: 'Project',
    items: [
      {
        title: 'Project Settings',
        description: 'Basic project configuration',
        icon: Settings,
        path: '/admin/settings/project',
        color: '#6366F1',
      },
      {
        title: 'Bookmarks',
        description: 'Saved collection bookmarks',
        icon: FileText,
        path: '/admin/settings/bookmarks',
        color: '#EC4899',
      },
      {
        title: 'AI Settings',
        description: 'AI and automation features',
        icon: Globe,
        path: '/admin/settings/ai',
        color: '#F97316',
      },
      {
        title: 'Schema Sync',
        description: 'Sync schema with external systems',
        icon: Shield,
        path: '/admin/settings/schema-sync',
        color: '#22C55E',
      },
      {
        title: 'SEO',
        description: 'SEO and metadata settings',
        icon: Globe,
        path: '/admin/settings/seo',
        color: '#10B981',
      },
    ],
  },
];

export default function SettingsIndexPage() {
  const theme = useTheme();

  return (
    <Box sx={{ p: 4, overflow: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant='h4' fontWeight={700} gutterBottom>
          Settings
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Configure your project and manage system settings
        </Typography>
      </Box>

      {SETTINGS_SECTIONS.map((section) => (
        <Box key={section.category} sx={{ mb: 5 }}>
          <Typography
            variant='overline'
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              letterSpacing: 1,
              display: 'block',
              mb: 2,
            }}
          >
            {section.category}
          </Typography>
          <Grid container spacing={2}>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.path}>
                  <Link href={item.path} style={{ textDecoration: 'none' }}>
                    <Paper
                      sx={{
                        p: 2.5,
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 200ms',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: item.color,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 20px ${alpha(item.color, 0.15)}`,
                        },
                        '&:hover .arrow': {
                          transform: 'translateX(4px)',
                          opacity: 1,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '12px',
                            bgcolor: alpha(item.color, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={22} color={item.color} />
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant='subtitle1' fontWeight={700} noWrap>
                            {item.title}
                          </Typography>
                          <Typography
                            variant='caption'
                            color='text.secondary'
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {item.description}
                          </Typography>
                        </Box>
                        <Box
                          className='arrow'
                          sx={{
                            color: item.color,
                            opacity: 0,
                            transition: 'all 200ms',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <ArrowRight size={18} />
                        </Box>
                      </Box>
                    </Paper>
                  </Link>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}
    </Box>
  );
}
