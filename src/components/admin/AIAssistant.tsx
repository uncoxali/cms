'use client';

import { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme, alpha } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles, Wand2, FileText, Copy, Check, RefreshCw,
  Send, Bot, User, StopCircle, MessageCircle,
  Trash2, Search, PenTool, Languages
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface AIFeature {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  prompt: string;
  color: string;
}

const AI_FEATURES: AIFeature[] = [
  { id: 'improve', name: 'Improve Writing', icon: Wand2, description: 'Enhance your content with better wording', prompt: 'Improve this text while keeping the same meaning. Make it more professional and engaging:', color: '#8B5CF6' },
  { id: 'summarize', name: 'Summarize', icon: FileText, description: 'Create a brief summary of your content', prompt: 'Summarize this text in 2-3 concise sentences:', color: '#3B82F6' },
  { id: 'expand', name: 'Expand', icon: RefreshCw, description: 'Add more detail to your content', prompt: 'Expand this text with more detail, examples, and context:', color: '#10B981' },
  { id: 'seo', name: 'SEO Keywords', icon: Search, description: 'Generate SEO keywords for your content', prompt: 'Extract SEO keywords from this text. Return as a comma-separated list:', color: '#F59E0B' },
  { id: 'grammar', name: 'Fix Grammar', icon: PenTool, description: 'Fix grammar and spelling errors', prompt: 'Fix any grammar or spelling errors in this text. Return only the corrected text:', color: '#EF4444' },
  { id: 'translate', name: 'Translate', icon: Languages, description: 'Translate to another language', prompt: 'Translate this text to English:', color: '#EC4899' },
];

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

function MarkdownContent({ content }: { content: string }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{
      fontSize: 14, lineHeight: 1.7,
      '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
      '& h1, & h2, & h3': { mt: 1.5, mb: 0.5, fontWeight: 700 },
      '& ul, & ol': { pl: 2.5, mb: 1, mt: 0.5 },
      '& li': { mb: 0.25 },
      '& code': { px: 0.75, py: 0.25, borderRadius: '4px', fontSize: 13, fontFamily: 'monospace', bgcolor: alpha('#8B5CF6', isDark ? 0.2 : 0.08) },
      '& pre': { m: 0, mt: 1, mb: 1, p: 1.5, borderRadius: '8px', overflow: 'auto', bgcolor: isDark ? alpha('#000', 0.3) : '#1e1e2e' },
      '& pre code': { bgcolor: 'transparent', p: 0, fontSize: 12.5, color: '#e0def4' },
      '& blockquote': { m: 0, pl: 2, borderLeft: '3px solid #8B5CF6', color: 'text.secondary' },
      '& strong': { fontWeight: 700 },
    }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </Box>
  );
}

export default function AIAssistant() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [tab, setTab] = useState(0);

  // Content Tools state
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loadingTool, setLoadingTool] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const sendToAI = async (messages: { role: string; content: string }[], onChunk: (text: string) => void): Promise<string> => {
    const token = useAuthStore.getState().token;
    const abortController = new AbortController();
    abortRef.current = abortController;

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages }),
      signal: abortController.signal,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(errData?.error || `Server error (${res.status})`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response stream');

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(trimmed.slice(6));
          if (data.text) {
            fullText += data.text;
            onChunk(fullText);
          }
          if (data.error) throw new Error(data.error);
        } catch { /* skip */ }
      }
    }

    return fullText;
  };

  // Content Tools
  const handleGenerate = async () => {
    if (!input.trim() || !activeFeature) return;
    const feature = AI_FEATURES.find(f => f.id === activeFeature);
    if (!feature) return;

    setLoadingTool(true);
    setOutput('');

    try {
      await sendToAI(
        [
          { role: 'user', content: `${feature.prompt}\n\n${input}` },
        ],
        (text) => setOutput(text)
      );
    } catch (err: unknown) {
      setOutput(`Error: ${err instanceof Error ? err.message : 'Failed to generate'}`);
    } finally {
      setLoadingTool(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Chat
  const handleChatSend = async (text?: string) => {
    const msgText = text || chatInput.trim();
    if (!msgText || chatLoading) return;

    const userMsg: ChatMsg = { role: 'user', content: msgText, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const history = [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.content }));
      await sendToAI(history, (text) => {
        setChatMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: text };
          } else {
            updated.push({ role: 'assistant', content: text, timestamp: Date.now() });
          }
          return updated;
        });
      });
    } catch (err: unknown) {
      setChatMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant' && !last.content) {
          updated[updated.length - 1] = { ...last, content: `Error: ${err instanceof Error ? err.message : 'Failed'}` };
        } else if (!prev.find(m => m.role === 'assistant' && m.timestamp > userMsg.timestamp)) {
          updated.push({ role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Failed'}`, timestamp: Date.now() });
        }
        return updated;
      });
    } finally {
      setChatLoading(false);
    }
  };

  const stopChat = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const clearChat = () => setChatMessages([]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '12px',
            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={22} color="#fff" />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700}>AI Assistant</Typography>
            <Typography variant="body2" color="text.secondary">Powered by Gemma 3n via OpenRouter</Typography>
          </Box>
        </Box>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 120, fontSize: 14 },
        }}
      >
        <Tab icon={<PenTool size={18} />} label="Content Tools" iconPosition="start" />
        <Tab icon={<MessageCircle size={18} />} label="AI Chat" iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Input Panel */}
          <Paper sx={{ p: 3, flex: '1 1 400px', borderRadius: '16px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Sparkles size={22} color="#8B5CF6" />
              <Typography variant="h6" fontWeight={600}>Content Tools</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              {AI_FEATURES.map(feature => (
                <Chip
                  key={feature.id}
                  icon={<feature.icon size={15} />}
                  label={feature.name}
                  onClick={() => setActiveFeature(feature.id)}
                  variant={activeFeature === feature.id ? 'filled' : 'outlined'}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: 12,
                    ...(activeFeature === feature.id ? {
                      bgcolor: alpha(feature.color, 0.15),
                      color: feature.color,
                      borderColor: feature.color,
                    } : {
                      '&:hover': { borderColor: feature.color, bgcolor: alpha(feature.color, 0.05) },
                    }),
                  }}
                />
              ))}
            </Box>

            {activeFeature && (
              <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontSize: 13 }}>
                {AI_FEATURES.find(f => f.id === activeFeature)?.description}
              </Typography>
            )}

            <TextField
              label="Your Content"
              multiline
              rows={6}
              fullWidth
              placeholder="Enter your content here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8B5CF6' },
                },
              }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={loadingTool ? <StopCircle size={18} /> : <Sparkles size={18} />}
                onClick={loadingTool ? () => abortRef.current?.abort() : handleGenerate}
                disabled={!input.trim() || !activeFeature}
                fullWidth
                sx={{
                  borderRadius: '12px', py: 1.5, fontWeight: 600,
                  bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' },
                }}
              >
                {loadingTool ? 'Stop' : 'Generate'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => { setInput(''); setOutput(''); setActiveFeature(null); }}
                disabled={!input && !output}
                sx={{ borderRadius: '12px' }}
              >
                Clear
              </Button>
            </Box>
          </Paper>

          {/* Output Panel */}
          <Paper sx={{ p: 3, flex: '1 1 400px', borderRadius: '16px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Sparkles size={22} color="#10B981" />
                <Typography variant="h6" fontWeight={600}>Output</Typography>
              </Box>
              {output && (
                <Tooltip title={copied ? 'Copied!' : 'Copy'}>
                  <IconButton size="small" onClick={handleCopy}>
                    {copied ? <Check size={18} color="#10B981" /> : <Copy size={18} />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {loadingTool && (
              <LinearProgress sx={{ mb: 2, borderRadius: 1, '& .MuiLinearProgress-bar': { bgcolor: '#8B5CF6' } }} />
            )}

            <Paper
              variant="outlined"
              sx={{
                p: 2.5, minHeight: 250, borderRadius: '12px',
                bgcolor: alpha('#10B981', isDark ? 0.05 : 0.02),
                borderColor: output ? alpha('#10B981', 0.3) : 'divider',
              }}
            >
              {output ? (
                <MarkdownContent content={output} />
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, opacity: 0.4 }}>
                  <Sparkles size={40} />
                  <Typography variant="body2" color="text.secondary" mt={2}>
                    Generated content will appear here
                  </Typography>
                </Box>
              )}
            </Paper>
          </Paper>
        </Box>
      )}

      {tab === 1 && (
        <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
          {/* Chat Messages */}
          <Box sx={{ height: 500, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { borderRadius: 3, bgcolor: alpha('#8B5CF6', 0.2) } }}>
            {chatMessages.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '16px', background: `linear-gradient(135deg, ${alpha('#8B5CF6', 0.15)}, ${alpha('#EC4899', 0.15)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <Sparkles size={28} color="#8B5CF6" />
                </Box>
                <Typography variant="h6" fontWeight={700}>AI Chat</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 300 }}>
                  Ask anything about your CMS, content management, or get help with your project.
                </Typography>
              </Box>
            ) : (
              <>
                {chatMessages.map((msg, i) => (
                  <Box key={i} sx={{
                    display: 'flex', gap: 1.5, mb: 2.5,
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    animation: 'fadeInUp 300ms ease-out',
                    '@keyframes fadeInUp': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                  }}>
                    <Avatar sx={{
                      width: 32, height: 32, flexShrink: 0,
                      bgcolor: msg.role === 'user' ? '#8B5CF6' : alpha('#8B5CF6', 0.1),
                      color: msg.role === 'user' ? '#fff' : '#8B5CF6',
                    }}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </Avatar>
                    <Box sx={{ maxWidth: '80%' }}>
                      {msg.role === 'assistant' && (
                        <Typography fontSize={11} color="text.secondary" fontWeight={600} sx={{ mb: 0.5, ml: 0.5 }}>AI</Typography>
                      )}
                      <Box sx={{
                        px: 2, py: 1.5,
                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        ...(msg.role === 'user'
                          ? { background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', color: '#fff' }
                          : { bgcolor: alpha('#8B5CF6', 0.04), border: `1px solid ${alpha('#8B5CF6', 0.1)}` }),
                      }}>
                        {msg.role === 'user' ? (
                          <Typography fontSize={14} sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                        ) : (
                          <MarkdownContent content={msg.content || '...'} />
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
                {chatLoading && (chatMessages.length === 0 || chatMessages[chatMessages.length - 1]?.role === 'user') && (
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6' }}><Bot size={16} /></Avatar>
                    <Box sx={{ px: 2, py: 1, borderRadius: '16px 16px 16px 4px', bgcolor: alpha('#8B5CF6', 0.04), border: `1px solid ${alpha('#8B5CF6', 0.1)}` }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {[0, 1, 2].map(j => (
                          <Box key={j} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.secondary', animation: 'tb 1.4s infinite ease-in-out', animationDelay: `${j * 0.2}s`, '@keyframes tb': { '0%,80%,100%': { opacity: 0.3 }, '40%': { opacity: 1 } } }} />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </Box>

          {/* Chat Input */}
          <Box sx={{ p: 2.5, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 1 }}>
            {chatMessages.length > 0 && (
              <Tooltip title="New Chat">
                <IconButton onClick={clearChat} sx={{ color: 'text.secondary' }}><Trash2 size={18} /></IconButton>
              </Tooltip>
            )}
            <TextField
              fullWidth
              multiline
              maxRows={3}
              size="small"
              placeholder="Ask me anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={chatLoading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8B5CF6' } } }}
            />
            {chatLoading ? (
              <IconButton onClick={stopChat} sx={{ bgcolor: alpha('#EF4444', 0.1), color: '#EF4444', '&:hover': { bgcolor: alpha('#EF4444', 0.2) } }}>
                <StopCircle size={20} />
              </IconButton>
            ) : (
              <IconButton
                onClick={() => handleChatSend()}
                disabled={!chatInput.trim()}
                sx={{
                  bgcolor: chatInput.trim() ? '#8B5CF6' : alpha('#8B5CF6', 0.1),
                  color: chatInput.trim() ? '#fff' : '#8B5CF6',
                  '&:hover': { bgcolor: chatInput.trim() ? '#7C3AED' : alpha('#8B5CF6', 0.15) },
                }}
              >
                <Send size={18} />
              </IconButton>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
