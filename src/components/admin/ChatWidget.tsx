"use client";

import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import { alpha, useTheme } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot, X, Send, Paperclip, Copy, Check, Sparkles,
  MessageCircle, Trash2, StopCircle,
  FileText, User, RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface ChatMsg {
  role: 'user' | 'model';
  content: string;
  file?: { name: string; mimeType: string; data: string; preview?: string };
  timestamp: number;
}

const STORAGE_KEY = 'neurofy-ai-chat-history';

const SUGGESTIONS = [
  'How do I create a new collection?',
  'Explain the data model in this CMS',
  'How can I set up webhooks?',
  'What features are available?',
];

function TypingDots() {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', p: 1 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 7, height: 7, borderRadius: '50%', bgcolor: 'text.secondary',
            animation: 'typingBounce 1.4s infinite ease-in-out',
            animationDelay: `${i * 0.2}s`,
            '@keyframes typingBounce': {
              '0%, 80%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
              '40%': { opacity: 1, transform: 'scale(1)' },
            },
          }}
        />
      ))}
    </Box>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      className="ai-markdown"
      sx={{
        fontSize: 14, lineHeight: 1.7,
        '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
        '& h1, & h2, & h3, & h4': { mt: 1.5, mb: 0.5, fontWeight: 700 },
        '& h1': { fontSize: 20 }, '& h2': { fontSize: 17 }, '& h3': { fontSize: 15 },
        '& ul, & ol': { pl: 2.5, mb: 1, mt: 0.5 },
        '& li': { mb: 0.25 },
        '& code': {
          px: 0.75, py: 0.25, borderRadius: '4px', fontSize: 13, fontFamily: 'monospace',
          bgcolor: alpha('#8B5CF6', isDark ? 0.2 : 0.08),
        },
        '& pre': { m: 0, mt: 1, mb: 1, p: 1.5, borderRadius: '8px', overflow: 'auto', bgcolor: isDark ? alpha('#000', 0.3) : '#1e1e2e' },
        '& pre code': { bgcolor: 'transparent', p: 0, fontSize: 12.5, color: '#e0def4' },
        '& blockquote': { m: 0, mt: 0.5, mb: 0.5, pl: 2, borderLeft: '3px solid #8B5CF6', color: 'text.secondary' },
        '& table': { width: '100%', borderCollapse: 'collapse', mt: 1, mb: 1, fontSize: 13 },
        '& th, & td': { p: 1, border: `1px solid ${alpha('#8B5CF6', 0.2)}`, textAlign: 'left' },
        '& th': { bgcolor: alpha('#8B5CF6', 0.08), fontWeight: 600 },
        '& a': { color: '#8B5CF6', textDecoration: 'underline' },
        '& strong': { fontWeight: 700 },
        '& hr': { border: 'none', borderTop: `1px solid ${alpha('#8B5CF6', 0.15)}`, my: 1.5 },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </Box>
  );
}

function MessageBubble({ msg, isStreaming, onCopy }: { msg: ChatMsg; isStreaming: boolean; onCopy: (text: string) => void }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{
      display: 'flex', gap: 1.5, mb: 2,
      flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start',
      animation: 'fadeInUp 300ms ease-out',
      '@keyframes fadeInUp': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
    }}>
      <Avatar sx={{
        width: 32, height: 32, flexShrink: 0, mt: 0.5,
        bgcolor: isUser ? '#8B5CF6' : alpha('#8B5CF6', 0.1),
        color: isUser ? '#fff' : '#8B5CF6',
      }}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </Avatar>

      <Box sx={{ maxWidth: '82%', minWidth: 0 }}>
        {!isUser && (
          <Typography fontSize={11} color="text.secondary" fontWeight={600} sx={{ mb: 0.5, ml: 0.5 }}>AI Assistant</Typography>
        )}

        {msg.file && (
          <Box sx={{ mb: 1, p: 1.5, borderRadius: '10px', bgcolor: alpha('#8B5CF6', 0.06), display: 'flex', alignItems: 'center', gap: 1 }}>
            {msg.file.mimeType.startsWith('image/') && msg.file.preview ? (
              <Box component="img" src={msg.file.preview} sx={{ width: 40, height: 40, borderRadius: '6px', objectFit: 'cover' }} />
            ) : (
              <FileText size={20} />
            )}
            <Typography fontSize={12} fontWeight={500} noWrap sx={{ maxWidth: 180 }}>{msg.file.name}</Typography>
          </Box>
        )}

        <Box sx={{
          px: 2, py: 1.5,
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          ...(isUser
            ? { background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', color: '#fff' }
            : { bgcolor: alpha('#8B5CF6', 0.04), border: `1px solid ${alpha('#8B5CF6', 0.1)}`, color: 'text.primary' }),
        }}>
          {isUser ? (
            <Typography fontSize={14} sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>{msg.content}</Typography>
          ) : (
            <MarkdownContent content={msg.content || '...'} />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, ml: 0.5, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
          <Typography fontSize={10} color="text.secondary">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
          {!isUser && !isStreaming && msg.content && (
            <Tooltip title={copied ? 'Copied!' : 'Copy'}>
              <IconButton size="small" onClick={handleCopy} sx={{ p: 0.25 }}>
                {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default function ChatWidget() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<{ name: string; mimeType: string; data: string; preview?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const user = useAuthStore((s) => s.user);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.map(({ file: _f, ...r }) => r)));
      } catch { /* ignore */ }
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const clearChat = () => {
    setMessages([]);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setFile({ name: selected.name, mimeType: selected.type, data: base64, preview: selected.type.startsWith('image/') ? reader.result as string : undefined });
    };
    reader.readAsDataURL(selected);
    e.target.value = '';
  };

  const stopGeneration = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const handleSend = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;

    setError(null);
    const userMsg: ChatMsg = { role: 'user', content: msgText, file: file || undefined, timestamp: Date.now() };
    const currentFile = file;

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setFile(null);
    setLoading(true);
    setStreaming(true);

    const historyForApi = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
    const abortController = new AbortController();
    abortRef.current = abortController;

    let accumulated = '';
    let gotAnyResponse = false;

    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: historyForApi,
          file: currentFile ? { mimeType: currentFile.mimeType, data: currentFile.data } : undefined,
        }),
        signal: abortController.signal,
      });

      // Check for non-streaming error response
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('text/event-stream')) {
        let errMsg = `Server error (${res.status})`;
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch { /* not json */ }
        throw new Error(errMsg);
      }

      // Add empty model message placeholder
      setMessages((prev) => [...prev, { role: 'model', content: '', timestamp: Date.now() }]);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const jsonStr = trimmed.slice(6);
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.text) {
              gotAnyResponse = true;
              accumulated += data.text;
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'model') {
                  updated[updated.length - 1] = { ...last, content: accumulated };
                }
                return updated;
              });
            }

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.done) {
              // Stream completed successfully
            }
          } catch (parseErr) {
            // Only throw if it's a real error, not a JSON parse issue on empty/done messages
            if (parseErr instanceof Error && parseErr.message !== 'Stream interrupted') {
              // Ignore parse errors for non-critical data
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.text) {
              accumulated += data.text;
              gotAnyResponse = true;
            }
            if (data.error) throw new Error(data.error);
          } catch { /* ignore final buffer parse errors */ }
        }
      }

      if (!gotAnyResponse && !accumulated) {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'model' && !last.content) {
            updated[updated.length - 1] = { ...last, content: 'Sorry, I could not generate a response. Please try again.' };
          }
          return updated;
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';

      if (err instanceof Error && err.name === 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'model' && !last.content) {
            updated[updated.length - 1] = { ...last, content: accumulated || 'Generation stopped.' };
          } else if (!gotAnyResponse) {
            // No model message yet, add one
            updated.push({ role: 'model', content: accumulated || 'Generation stopped.', timestamp: Date.now() });
          }
          return updated;
        });
      } else {
        setError(errorMessage);
        // Remove empty model message if we got an error before any response
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'model' && !last.content) {
            updated.pop();
          }
          return updated;
        });
      }
    } finally {
      setLoading(false);
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => { /* clipboard not available */ });
  };

  return (
    <>
      <Fab
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1300,
          width: 56, height: 56,
          background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
          transition: 'all 300ms ease',
          '&:hover': { background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', transform: 'scale(1.08)', boxShadow: '0 12px 40px rgba(139, 92, 246, 0.5)' },
        }}
      >
        <Sparkles size={24} color="#fff" />
      </Fab>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 440 }, bgcolor: 'background.default', backgroundImage: 'none' } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 38, height: 38, borderRadius: '12px', background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} color="#fff" />
              </Box>
              <Box>
                <Typography fontWeight={700} fontSize={15}>AI Assistant</Typography>
                <Typography fontSize={11} color="text.secondary">Powered by Llama 3.3</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {messages.length > 0 && (
                <Tooltip title="New Chat">
                  <IconButton size="small" onClick={clearChat} sx={{ color: 'text.secondary' }}><Trash2 size={16} /></IconButton>
                </Tooltip>
              )}
              <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}><X size={18} /></IconButton>
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ height: 2, '& .MuiLinearProgress-bar': { bgcolor: '#8B5CF6' }, '&.MuiLinearProgress-root': { bgcolor: alpha('#8B5CF6', 0.1) } }} />}

          {/* Messages Area */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2.5, py: 2, display: 'flex', flexDirection: 'column', '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { borderRadius: 3, bgcolor: alpha('#8B5CF6', 0.2) } }}>
            {/* Error Alert */}
            {error && (
              <Alert
                severity="error"
                onClose={() => setError(null)}
                sx={{ mb: 2, borderRadius: '12px', '& .MuiAlert-message': { fontSize: 13 } }}
                action={
                  <IconButton size="small" onClick={() => handleSend()} sx={{ color: 'inherit' }}>
                    <RefreshCw size={14} />
                  </IconButton>
                }
              >
                {error}
              </Alert>
            )}

            {messages.length === 0 ? (
              /* Empty State */
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', px: 3 }}>
                <Box sx={{ width: 72, height: 72, borderRadius: '20px', background: `linear-gradient(135deg, ${alpha('#8B5CF6', 0.15)}, ${alpha('#EC4899', 0.15)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                  <Sparkles size={32} color="#8B5CF6" />
                </Box>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>Hey{user?.name ? `, ${user.name}` : ''}!</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 280 }}>
                  I&apos;m your AI assistant. Ask me anything about your CMS project.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', maxWidth: 320 }}>
                  {SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outlined"
                      size="small"
                      onClick={() => handleSend(suggestion)}
                      sx={{
                        justifyContent: 'flex-start', textAlign: 'left', borderRadius: '12px', px: 2, py: 1.25, fontSize: 13, textTransform: 'none',
                        borderColor: alpha('#8B5CF6', isDark ? 0.3 : 0.2), color: 'text.primary',
                        '&:hover': { borderColor: '#8B5CF6', bgcolor: alpha('#8B5CF6', 0.05) },
                      }}
                      startIcon={<MessageCircle size={15} style={{ color: '#8B5CF6', flexShrink: 0 }} />}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </Box>
              </Box>
            ) : (
              /* Messages */
              <>
                {messages.map((msg, i) => (
                  <MessageBubble
                    key={`${i}-${msg.timestamp}`}
                    msg={msg}
                    isStreaming={streaming && i === messages.length - 1 && msg.role === 'model'}
                    onCopy={handleCopy}
                  />
                ))}
                {loading && (messages.length === 0 || messages[messages.length - 1]?.role === 'user' || !messages[messages.length - 1]?.content) && (
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6' }}><Bot size={16} /></Avatar>
                    <Box sx={{ px: 2, py: 1, borderRadius: '16px 16px 16px 4px', bgcolor: alpha('#8B5CF6', isDark ? 0.08 : 0.04), border: `1px solid ${alpha('#8B5CF6', isDark ? 0.15 : 0.1)}` }}>
                      <TypingDots />
                    </Box>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </Box>

          {/* File Preview */}
          {file && (
            <Box sx={{ px: 2.5, pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '12px', bgcolor: alpha('#8B5CF6', isDark ? 0.1 : 0.05), border: `1px solid ${alpha('#8B5CF6', 0.15)}` }}>
                {file.preview ? (
                  <Box component="img" src={file.preview} sx={{ width: 40, height: 40, borderRadius: '8px', objectFit: 'cover' }} />
                ) : (
                  <FileText size={24} color="#8B5CF6" />
                )}
                <Typography fontSize={13} fontWeight={500} sx={{ flex: 1 }} noWrap>{file.name}</Typography>
                <IconButton size="small" onClick={() => setFile(null)}><X size={14} /></IconButton>
              </Box>
            </Box>
          )}

          {/* Input Area */}
          <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <input ref={fileInputRef} type="file" hidden onChange={handleFileSelect} accept="image/*,.pdf,.txt,.csv,.json,.md" />
              <Tooltip title="Attach file">
                <IconButton size="small" onClick={() => fileInputRef.current?.click()} disabled={loading} sx={{ color: 'text.secondary', mb: 0.5, '&:hover': { color: '#8B5CF6', bgcolor: alpha('#8B5CF6', 0.08) } }}>
                  <Paperclip size={18} />
                </IconButton>
              </Tooltip>

              <TextField
                fullWidth multiline maxRows={4} size="small"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', fontSize: 14, '&.Mui-focused': { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#8B5CF6', borderWidth: 1.5 } } } }}
              />

              {loading ? (
                <Tooltip title="Stop">
                  <IconButton onClick={stopGeneration} sx={{ bgcolor: alpha('#EF4444', 0.1), color: '#EF4444', mb: 0.5, '&:hover': { bgcolor: alpha('#EF4444', 0.2) } }}>
                    <StopCircle size={20} />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Send">
                  <IconButton
                    onClick={() => handleSend()}
                    disabled={!input.trim() && !file}
                    sx={{
                      bgcolor: input.trim() || file ? '#8B5CF6' : alpha('#8B5CF6', 0.1),
                      color: input.trim() || file ? '#fff' : '#8B5CF6',
                      mb: 0.5,
                      '&:hover': { bgcolor: input.trim() || file ? '#7C3AED' : alpha('#8B5CF6', 0.15) },
                      '&.Mui-disabled': { color: alpha('#8B5CF6', 0.3) },
                    }}
                  >
                    <Send size={18} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Typography fontSize={10} color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              Gemma 3n (OpenRouter) &middot; Fast &amp; Low Cost
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
