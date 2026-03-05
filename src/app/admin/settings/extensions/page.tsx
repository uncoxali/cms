"use client";

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { ExtensionRegistry } from '@/lib/meta/registry';
import { useActivityStore } from '@/store/activity';

export default function ExtensionsPage() {
  const { addLog } = useActivityStore();

  // Local state to track enabled/disabled extensions
  const [disabledModules, setDisabledModules] = useState<string[]>([]);
  const [disabledPanels, setDisabledPanels] = useState<string[]>([]);
  const [disabledInterfaces, setDisabledInterfaces] = useState<string[]>([]);

  const toggleModule = (id: string) => {
    const isDisabled = disabledModules.includes(id);
    setDisabledModules(isDisabled ? disabledModules.filter(m => m !== id) : [...disabledModules, id]);
    addLog({ action: 'update', collection: 'extensions', item: id, user: 'Admin User', meta: { type: 'module', enabled: isDisabled } });
  };

  const togglePanel = (id: string) => {
    const isDisabled = disabledPanels.includes(id);
    setDisabledPanels(isDisabled ? disabledPanels.filter(m => m !== id) : [...disabledPanels, id]);
    addLog({ action: 'update', collection: 'extensions', item: id, user: 'Admin User', meta: { type: 'panel', enabled: isDisabled } });
  };

  const toggleInterface = (id: string) => {
    const isDisabled = disabledInterfaces.includes(id);
    setDisabledInterfaces(isDisabled ? disabledInterfaces.filter(m => m !== id) : [...disabledInterfaces, id]);
    addLog({ action: 'update', collection: 'extensions', item: id, user: 'Admin User', meta: { type: 'interface', enabled: isDisabled } });
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Extensions & Modules
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
        View and manage all loaded modules, dashboard panels, and field interfaces. Toggle extensions on/off to control platform behavior.
      </Typography>

      <Box sx={{ mb: 6 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          App Modules ({ExtensionRegistry.modules.length})
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Full-page applications accessible via the primary navigation sidebar.
        </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {ExtensionRegistry.modules.map(mod => {
            const isEnabled = !disabledModules.includes(mod.id);
            return (
              <Card variant="outlined" key={mod.id} sx={{ opacity: isEnabled ? 1 : 0.5 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, display: 'flex' }}>
                    <mod.icon size={24} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography fontWeight={600}>{mod.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      v{mod.version} • {mod.author}
                    </Typography>
                  </Box>
                  <Switch checked={isEnabled} onChange={() => toggleModule(mod.id)} size="small" />
                </CardContent>
              </Card>
            );
          })}
          </Box>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ mb: 6 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Dashboard Panels ({ExtensionRegistry.panels.length})
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Widget types available for use within Insights modules.
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {ExtensionRegistry.panels.map(panel => {
            const isEnabled = !disabledPanels.includes(panel.id);
            return (
              <Card variant="outlined" key={panel.id} sx={{ opacity: isEnabled ? 1 : 0.5 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight={600}>{panel.name}</Typography>
                    <Switch checked={isEnabled} onChange={() => togglePanel(panel.id)} size="small" />
                  </Box>
                  <Typography variant="caption" color="text.secondary">v{panel.version} • {panel.author}</Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ mb: 6 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Field Interfaces ({ExtensionRegistry.interfaces.length})
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Custom input components for content forms.
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {ExtensionRegistry.interfaces.map(field => {
            const isEnabled = !disabledInterfaces.includes(field.id);
            return (
              <Card variant="outlined" key={field.id} sx={{ opacity: isEnabled ? 1 : 0.5 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight={600}>{field.name}</Typography>
                    <Switch checked={isEnabled} onChange={() => toggleInterface(field.id)} size="small" />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">v{field.version} • {field.author}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                    {field.supportedTypes.map(type => (
                      <Chip key={type} label={type} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
