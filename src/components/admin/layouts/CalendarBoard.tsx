'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import { useTheme, alpha } from '@mui/material/styles';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';

interface CalendarEvent {
  id: string | number;
  title: string;
  date: string;
  color?: string;
  item: any;
}

interface CalendarBoardProps {
  collectionKey: string;
  dateField: string;
  titleField: string;
  fields: any[];
  onItemUpdate: () => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarBoard({ 
  collectionKey, 
  dateField, 
  titleField,
  fields,
  onItemUpdate 
}: CalendarBoardProps) {
  const theme = useTheme();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      
      const res = await api.get<{ data: any[] }>(`/items/${String(collectionKey)}`, {
        limit: String(1000),
        filter: JSON.stringify({
          [dateField]: {
            _gte: startDate,
            _lte: endDate,
          },
        }),
      });

      const eventItems: CalendarEvent[] = (res.data || []).map((item) => ({
        id: item.id,
        title: item[titleField] || item.title || item.name || `#${item.id}`,
        date: item[dateField],
        color: item.color || '#6366F1',
        item,
      }));

      setEvents(eventItems);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, [collectionKey, dateField, titleField, year, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === month && 
             eventDate.getFullYear() === year;
    });
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  const days = getDaysInMonth();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {MONTHS[month]} {year}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={prevMonth} size="small">
            <ChevronLeft size={20} />
          </IconButton>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <IconButton onClick={nextMonth} size="small">
            <ChevronRight size={20} />
          </IconButton>
        </Box>
      </Box>

      <Paper sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${theme.palette.divider}` }}>
          {DAYS.map(day => (
            <Box 
              key={day} 
              sx={{ 
                p: 1.5, 
                textAlign: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              }}
            >
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days.map((day, idx) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const isCurrentDay = day && isToday(day);
            
            return (
              <Box
                key={idx}
                sx={{
                  minHeight: 120,
                  borderRight: idx % 7 !== 6 ? `1px solid ${theme.palette.divider}` : 'none',
                  borderBottom: idx < days.length - 7 ? `1px solid ${theme.palette.divider}` : 'none',
                  p: 1,
                  bgcolor: isCurrentDay ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                  transition: 'background-color 200ms ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                {day && (
                  <>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isCurrentDay ? 700 : 500,
                        color: isCurrentDay ? 'primary.main' : 'text.primary',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: isCurrentDay ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                        mb: 0.5,
                      }}
                    >
                      {day}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {dayEvents.slice(0, 3).map(event => (
                        <Box
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          sx={{
                            p: 0.5,
                            borderRadius: 1,
                            bgcolor: alpha(event.color || '#6366F1', 0.15),
                            borderLeft: `3px solid ${event.color || '#6366F1'}`,
                            cursor: 'pointer',
                            transition: 'all 150ms ease',
                            '&:hover': {
                              bgcolor: alpha(event.color || '#6366F1', 0.25),
                              transform: 'translateX(2px)',
                            },
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 600, 
                              fontSize: 11,
                              color: theme.palette.getContrastText(theme.palette.background.paper),
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {event.title}
                          </Typography>
                        </Box>
                      ))}
                      {dayEvents.length > 3 && (
                        <Typography variant="caption" color="text.secondary" fontSize={10}>
                          +{dayEvents.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>

      {selectedEvent && (
        <Paper 
          sx={{ 
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            p: 3,
            minWidth: 300,
            zIndex: 1000,
            boxShadow: 8,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Typography variant="h6" fontWeight={700} mb={2}>
            {selectedEvent.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {new Date(selectedEvent.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button 
              variant="contained" 
              size="small"
              onClick={() => {
                window.location.href = `/admin/content/${collectionKey}/${selectedEvent.id}`;
              }}
            >
              View Details
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => setSelectedEvent(null)}
            >
              Close
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
