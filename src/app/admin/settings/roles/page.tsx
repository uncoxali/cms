"use client";

import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Link from 'next/link';
import { Plus, Shield } from 'lucide-react';
import { useRolesStore } from '@/store/roles';
import { useActivityStore } from '@/store/activity';

export default function RolesListPage() {
  const { roles, fetchRoles, addRole } = useRolesStore();
  const { addLog } = useActivityStore();

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const handleCreate = async () => {
    await addRole({
      name: 'New Role',
      description: 'Configure this role.',
      appAccess: true,
      adminAccess: false,
      permissions: []
    });
    addLog({ action: 'create', collection: 'roles', user: 'Admin User', meta: { name: 'New Role' } });
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} display="flex" alignItems="center" gap={1}>
            <Shield size={28} /> Roles & Permissions
          </Typography>
          <Typography variant="body2" color="text.secondary">Manage user roles and their associated access controls.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleCreate}>Create Role</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Role Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Users</TableCell>
              <TableCell>App Access</TableCell>
              <TableCell>Admin Access</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map(role => (
              <TableRow key={role.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{role.name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{role.description}</Typography>
                </TableCell>
                <TableCell>{role.userCount}</TableCell>
                <TableCell><Chip label={role.appAccess ? 'Yes' : 'No'} size="small" color={role.appAccess ? 'success' : 'default'} /></TableCell>
                <TableCell><Chip label={role.adminAccess ? 'Yes' : 'No'} size="small" color={role.adminAccess ? 'error' : 'default'} /></TableCell>
                <TableCell align="right">
                  <Link href={`/admin/settings/roles/${role.id}`} passHref style={{ textDecoration: 'none' }}>
                    <Button size="small" variant="outlined">Configure</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
