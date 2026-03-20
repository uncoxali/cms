'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Divider from '@mui/material/Divider';
import { Globe, Search, Share2, FileText, Check } from 'lucide-react';
import { useTheme } from '@mui/material/styles';
import { api } from '@/lib/api';

interface SEOConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  defaultOgImage: string;
  twitterHandle: string;
  enableAutoKeywords: boolean;
  enableAutoDescriptions: boolean;
  enableStructuredData: boolean;
  enableSitemap: boolean;
  enableRobotsTxt: boolean;
}

export default function SEOSettings() {
  const [config, setConfig] = useState<SEOConfig>({
    siteName: '',
    siteDescription: '',
    siteUrl: '',
    defaultOgImage: '',
    twitterHandle: '',
    enableAutoKeywords: true,
    enableAutoDescriptions: true,
    enableStructuredData: true,
    enableSitemap: true,
    enableRobotsTxt: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const theme = useTheme();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get<{ data: SEOConfig }>('/settings/seo');
      if (res.data) {
        setConfig(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch SEO config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/seo', config);
      setSnackbar({ open: true, message: 'SEO settings saved successfully', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to save', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const generateMetaDescription = (content: string, maxLength = 160) => {
    if (!content) return '';
    const cleanText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.slice(0, maxLength - 3) + '...';
  };

  const generateKeywords = (content: string) => {
    if (!content) return '';
    const words = content
      .toLowerCase()
      .replace(/<[^>]*>/g, '')
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const freq: Record<string, number> = {};
    words.forEach((w) => (freq[w] = (freq[w] || 0) + 1));
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
      .join(', ');
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={1}>
        SEO Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Configure your site&apos;s SEO settings and metadata.
      </Typography>

      {loading ? (
        <Typography color="text.secondary">Loading...</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Globe size={20} color={theme.palette.primary.main} />
              <Typography variant="h6" fontWeight={600}>
                Basic Settings
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Site Name"
                fullWidth
                value={config.siteName}
                onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                placeholder="My Awesome Site"
              />
              <TextField
                label="Site Description"
                fullWidth
                multiline
                rows={3}
                value={config.siteDescription}
                onChange={(e) => setConfig({ ...config, siteDescription: e.target.value })}
                placeholder="A brief description of your website"
                helperText={`${config.siteDescription.length}/160 characters recommended`}
              />
              <TextField
                label="Site URL"
                fullWidth
                value={config.siteUrl}
                onChange={(e) => setConfig({ ...config, siteUrl: e.target.value })}
                placeholder="https://example.com"
              />
              <TextField
                label="Default OG Image URL"
                fullWidth
                value={config.defaultOgImage}
                onChange={(e) => setConfig({ ...config, defaultOgImage: e.target.value })}
                placeholder="https://example.com/og-image.png"
                helperText="Used when no specific image is available"
              />
              <TextField
                label="Twitter Handle"
                fullWidth
                value={config.twitterHandle}
                onChange={(e) => setConfig({ ...config, twitterHandle: e.target.value })}
                placeholder="@yourhandle"
              />
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Search size={20} color={theme.palette.primary.main} />
              <Typography variant="h6" fontWeight={600}>
                Auto Generation
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableAutoKeywords}
                    onChange={(e) => setConfig({ ...config, enableAutoKeywords: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>Auto-generate Keywords</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Extract keywords from content automatically
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableAutoDescriptions}
                    onChange={(e) => setConfig({ ...config, enableAutoDescriptions: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>Auto-generate Descriptions</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Generate meta descriptions from content
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableStructuredData}
                    onChange={(e) => setConfig({ ...config, enableStructuredData: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>Structured Data (JSON-LD)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Add Schema.org structured data to pages
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Share2 size={20} color={theme.palette.primary.main} />
              <Typography variant="h6" fontWeight={600}>
                Auto-generation Features
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableSitemap}
                    onChange={(e) => setConfig({ ...config, enableSitemap: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>Auto-generate Sitemap</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Generate /sitemap.xml automatically
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableRobotsTxt}
                    onChange={(e) => setConfig({ ...config, enableRobotsTxt: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>Auto-generate robots.txt</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Generate /robots.txt automatically
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <FileText size={20} color={theme.palette.primary.main} />
              <Typography variant="h6" fontWeight={600}>
                Preview
              </Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                bgcolor: '#fff',
                borderRadius: 1,
                color: '#1a0dab',
              }}
            >
              <Typography sx={{ fontSize: 18, fontWeight: 400, mb: 0.5 }}>
                {config.siteName || 'Site Name'} - Page Title
              </Typography>
              <Typography sx={{ fontSize: 14, color: '#006621', mb: 0.5 }}>
                {config.siteUrl || 'https://example.com'} › page-slug
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#545454', lineHeight: 1.4 }}>
                {generateMetaDescription(config.siteDescription) || 'Your page description will appear here...'}
              </Typography>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={saving ? null : <Check size={18} />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
