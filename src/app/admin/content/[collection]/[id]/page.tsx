"use client";

import { use } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import { notFound, useRouter } from 'next/navigation';
import { Check, X, RotateCcw, Clock } from 'lucide-react';
import { useRevisionsStore, Revision } from '@/store/revisions';
import { useState, useEffect } from 'react';
import { useSchemaStore } from '@/store/schema';

export default function ItemEditorPage({ params }: { params: Promise<{ collection: string; id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { collection, id } = resolvedParams;
  
  const { collections } = useSchemaStore();
  const config = collections[collection];

  if (!config) {
    notFound();
  }

  const isNew = id === 'new';

  const { addRevision, getRevisionsForItem } = useRevisionsStore();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // Temporary selected revision for diff view
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);

  useEffect(() => {
    if (!isNew) {
      setRevisions(getRevisionsForItem(collection, id));
      // Mock initial data load
      setFormData({
        id: id,
        title: `Mock Item ${id}`,
        price: 100,
        isActive: true
      });
    }
  }, [collection, id, isNew, getRevisionsForItem]);

  const handleSave = () => {
    if (!isNew) {
      addRevision({
        collection,
        itemId: id,
        dataSnapshot: formData,
        createdBy: 'Admin User'
      });
    }
    router.back();
  };

  const handleRestore = (rev: Revision) => {
    setFormData(rev.dataSnapshot);
    setSelectedRevision(null);
    setActiveTab(0);
    // Add a new revision saying we restored
    addRevision({
      collection,
      itemId: id,
      dataSnapshot: rev.dataSnapshot,
      createdBy: 'Admin User (Restored)'
    });
    setRevisions(getRevisionsForItem(collection, id));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>
          {isNew ? 'Create' : 'Edit'} {config.label} {isNew ? '' : `#${id}`}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => router.back()} startIcon={<X size={18} />}>
            Cancel
          </Button>
          <Button variant="contained" startIcon={<Check size={18} />} onClick={handleSave}>
            Save
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 4, flexGrow: 1, overflow: 'hidden' }}>
        <Paper sx={{ flexGrow: 1, p: 4, overflow: 'auto', backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(_, nv) => { setActiveTab(nv); setSelectedRevision(null); }}>
              <Tab label="Form" />
              {!isNew && <Tab label={`Revisions (${revisions.length})`} />}
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <Grid container spacing={3}>
              {config.fields.filter(f => f.group !== 'Meta').map(field => (
                <Grid size={{ xs: 12, sm: field.type === 'textarea' || field.type === 'rich-text' ? 12 : 6 }} key={field.name}>
                  {field.type === 'string' || field.type === 'number' ? (
                    <TextField 
                      fullWidth 
                      label={field.label} 
                      type={field.type === 'number' ? 'number' : 'text'}
                      required={field.required}
                      variant="outlined" 
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    />
                  ) : field.type === 'textarea' || field.type === 'rich-text' ? (
                    <TextField 
                      fullWidth 
                      label={field.label} 
                      multiline 
                      rows={4} 
                      required={field.required}
                      variant="outlined" 
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    />
                  ) : field.type === 'boolean' ? (
                    <FormControlLabel
                      control={<Switch color="primary" checked={!!formData[field.name]} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })} />}
                      label={field.label}
                    />
                  ) : (
                    <TextField 
                      fullWidth 
                      label={field.label} 
                      variant="outlined" 
                      helperText={`Mocked ${field.type} input`}
                    />
                  )}
                </Grid>
              ))}
            </Grid>
          )}

          {activeTab === 1 && !isNew && (
            <Box>
              {selectedRevision ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                      <Typography variant="h6">Viewing Revision</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(selectedRevision.createdAt).toLocaleString()} by {selectedRevision.createdBy}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button variant="outlined" onClick={() => setSelectedRevision(null)}>Back to List</Button>
                      <Button variant="contained" color="warning" startIcon={<RotateCcw size={18} />} onClick={() => handleRestore(selectedRevision)}>
                        Restore This Version
                      </Button>
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>Snapshot Data:</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#1e1e1e', color: '#d4d4d4', fontFamily: 'monospace', overflow: 'auto' }}>
                    <pre style={{ margin: 0 }}>
                      {JSON.stringify(selectedRevision.dataSnapshot, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              ) : (
                <List>
                  {revisions.length === 0 ? (
                    <Typography color="text.secondary" sx={{ p: 2 }}>No revisions found for this item.</Typography>
                  ) : revisions.map(rev => (
                    <ListItem 
                      key={rev.id} 
                      divider
                      secondaryAction={
                        <Button size="small" variant="outlined" onClick={() => setSelectedRevision(rev)}>View Snapshot</Button>
                      }
                    >
                      <Box sx={{ mr: 2, color: 'text.secondary' }}><Clock size={20} /></Box>
                      <ListItemText 
                        primary={`Saved by ${rev.createdBy}`}
                        secondary={new Date(rev.createdAt).toLocaleString()}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </Paper>

        <Paper sx={{ width: 300, flexShrink: 0, p: 3, backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" fontWeight={600}>Metadata</Typography>
          <Divider />
          {config.fields.filter(f => f.group === 'Meta').map(field => (
            <Box key={field.name}>
              <Typography variant="caption" color="text.secondary">{field.label}</Typography>
              <Typography variant="body2">{isNew ? '-' : `Mock ${field.name} Data`}</Typography>
            </Box>
          ))}
          {!isNew && (
            <>
              <Box>
                <Typography variant="caption" color="text.secondary">Date Created</Typography>
                <Typography variant="body2">2026-03-05 10:00:00</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">User Created</Typography>
                <Typography variant="body2">Admin User</Typography>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
