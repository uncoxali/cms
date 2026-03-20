'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import { useSchemaStore } from '@/store/schema';
import { usePermissionsStore, type ItemFilter } from '@/store/permissions';
import FilterBuilder from './FilterBuilder';
import { Layers, Filter, Info } from 'lucide-react';

interface ItemPermissionsEditorProps {
  roleId: string;
  collection: string;
  disabled?: boolean;
}

export default function ItemPermissionsEditor({
  roleId,
  collection,
  disabled = false,
}: ItemPermissionsEditorProps) {
  const collections = useSchemaStore((state) => state.collections);
  const collectionConfig = collections[collection];
  const fields = collectionConfig?.fields || [];

  const {
    permissions,
    isLoading,
    fetchRolePermissions,
    updateItemFilter,
  } = usePermissionsStore();

  const [localFilters, setLocalFilters] = useState<ItemFilter[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (roleId) {
      fetchRolePermissions(roleId);
    }
  }, [roleId, fetchRolePermissions]);

  useEffect(() => {
    const collectionPerms = permissions[roleId]?.collections?.[collection];
    const itemFilters = collectionPerms?.itemFilter || [];
    setLocalFilters(itemFilters);
    setHasChanges(false);
  }, [permissions, roleId, collection]);

  const handleFiltersChange = (newFilters: ItemFilter[]) => {
    setLocalFilters(newFilters);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateItemFilter(roleId, collection, localFilters);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save item filters:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setLocalFilters([]);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const effectiveFilters = localFilters;

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Info size={18} style={{ marginTop: 2, flexShrink: 0 }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Item-level Access Control
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Define filter rules to control which items in{' '}
              <strong>{collectionConfig?.label || collection}</strong> this role can access.
              Items not matching these filters will be completely hidden from the user.
            </Typography>
          </Box>
        </Box>
      </Alert>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Filter size={18} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Access Filter Rules
          </Typography>
        </Box>

        <FilterBuilder
          filters={effectiveFilters}
          onChange={handleFiltersChange}
          collection={collection}
          disabled={disabled}
        />
      </Box>

      {effectiveFilters.length > 0 && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Layers size={16} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Filter Summary
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {effectiveFilters.map((filter, index) => {
              const field = fields.find((f) => f.name === filter.field);
              const fieldLabel = field?.label || filter.field;
              
              return (
                <Chip
                  key={filter.id}
                  size="small"
                  label={
                    index > 0 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.7 }}>
                          {filter.conjunction?.toUpperCase()}
                        </Typography>
                        <Typography variant="caption">
                          {fieldLabel} {filter.operator.replace('_', ' ')} {filter.value || '(any)'}
                        </Typography>
                      </Box>
                    ) : (
                      `${fieldLabel} ${filter.operator.replace('_', ' ')} ${filter.value || '(any)'}`
                    )
                  }
                  sx={{ fontFamily: 'monospace' }}
                />
              );
            })}
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
            Users with this role will only see items matching all of the above conditions.
          </Typography>
        </Box>
      )}

      {effectiveFilters.length === 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          No filters configured. Users with this role will have access to all items in this collection.
        </Alert>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={disabled || !hasChanges || saving}
          size="small"
        >
          {saving ? 'Saving...' : 'Save Filters'}
        </Button>
        <Button
          variant="outlined"
          onClick={handleClear}
          disabled={disabled || effectiveFilters.length === 0 || saving}
          size="small"
          color="error"
        >
          Clear All Filters
        </Button>
      </Box>
    </Box>
  );
}
