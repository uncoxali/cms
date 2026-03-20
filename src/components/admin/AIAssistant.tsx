'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import { useTheme, alpha } from '@mui/material/styles';
import { 
  Sparkles, Wand2, Image, FileText, Mic, Copy, 
  Check, RefreshCw, Settings, X, Lightbulb
} from 'lucide-react';
import { api } from '@/lib/api';

interface AIFeature {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  prompt: string;
}

const AI_FEATURES: AIFeature[] = [
  {
    id: 'improve',
    name: 'Improve Writing',
    icon: Wand2,
    description: 'Enhance your content with better wording',
    prompt: 'Improve this text while keeping the same meaning:',
  },
  {
    id: 'summarize',
    name: 'Summarize',
    icon: FileText,
    description: 'Create a brief summary of your content',
    prompt: 'Summarize this text in 2-3 sentences:',
  },
  {
    id: 'expand',
    name: 'Expand',
    icon: RefreshCw,
    description: 'Add more detail to your content',
    prompt: 'Expand this text with more detail:',
  },
  {
    id: 'seo',
    name: 'SEO Keywords',
    icon: Sparkles,
    description: 'Generate SEO keywords for your content',
    prompt: 'Extract SEO keywords from this text (comma-separated):',
  },
  {
    id: 'grammar',
    name: 'Fix Grammar',
    icon: Lightbulb,
    description: 'Fix grammar and spelling errors',
    prompt: 'Fix any grammar or spelling errors in this text:',
  },
  {
    id: 'translate',
    name: 'Translate',
    icon: FileText,
    description: 'Translate to another language',
    prompt: 'Translate this text to English:',
  },
];

export default function AIAssistant() {
  const theme = useTheme();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFeatureClick = (feature: AIFeature) => {
    setActiveFeature(feature.id);
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    try {
      const res = await api.post<{ data: { response: string } }>('/ai/generate', {
        prompt: `${AI_FEATURES.find(f => f.id === activeFeature)?.prompt}\n\n${input}`,
      });
      setOutput(res.data?.response || 'No response generated');
    } catch (err: any) {
      setOutput(`Error: ${err.message || 'Failed to generate response'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setActiveFeature(null);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={1}>
        AI Assistant
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Use AI to improve your content and workflow.
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 3, flex: '1 1 400px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Sparkles size={24} color={theme.palette.primary.main} />
            <Typography variant="h6" fontWeight={600}>
              Content Tools
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            {AI_FEATURES.map(feature => (
              <Chip
                key={feature.id}
                icon={<feature.icon size={16} />}
                label={feature.name}
                onClick={() => handleFeatureClick(feature)}
                variant={activeFeature === feature.id ? 'filled' : 'outlined'}
                color={activeFeature === feature.id ? 'primary' : 'default'}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                }}
              />
            ))}
          </Box>

          {activeFeature && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                {AI_FEATURES.find(f => f.id === activeFeature)?.description}
              </Typography>
            </Box>
          )}

          <TextField
            label="Your Content"
            multiline
            rows={6}
            fullWidth
            placeholder="Enter your content here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={18} /> : <Sparkles size={18} />}
              onClick={handleGenerate}
              disabled={!input.trim() || !activeFeature || loading}
              fullWidth
            >
              {loading ? 'Generating...' : 'Generate'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={!input && !output}
            >
              Clear
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, flex: '1 1 400px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Sparkles size={24} color={theme.palette.success.main} />
              <Typography variant="h6" fontWeight={600}>
                Generated Output
              </Typography>
            </Box>
            {output && (
              <IconButton size="small" onClick={handleCopy}>
                {copied ? <Check size={18} color={theme.palette.success.main} /> : <Copy size={18} />}
              </IconButton>
            )}
          </Box>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              minHeight: 200,
              bgcolor: alpha(theme.palette.success.main, 0.02),
              borderColor: output ? theme.palette.success.main : theme.palette.divider,
            }}
          >
            {output ? (
              <Typography 
                variant="body1" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: output.length > 500 ? 'inherit' : 'inherit',
                }}
              >
                {output}
              </Typography>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: 200,
                opacity: 0.5,
              }}>
                <Sparkles size={40} color={theme.palette.text.disabled} />
                <Typography variant="body2" color="text.secondary" mt={2}>
                  Generated content will appear here
                </Typography>
              </Box>
            )}
          </Paper>

          {output && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                You can copy the generated content and paste it into your content.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>
          Image Generation
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Generate images using AI (requires OpenAI API key configuration).
        </Typography>
        
        <TextField
          label="Image Prompt"
          fullWidth
          placeholder="A beautiful sunset over the ocean..."
          sx={{ mb: 2 }}
        />
        
        <Button variant="outlined" startIcon={<Image size={18} />}>
          Generate Image
        </Button>
      </Paper>
    </Box>
  );
}
