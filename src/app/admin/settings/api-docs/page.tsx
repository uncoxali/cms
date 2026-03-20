'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { useSchemaStore } from '@/store/schema';
import CircularProgress from '@mui/material/CircularProgress';

if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('UNSAFE_componentWillReceiveProps')) {
      return;
    }
    originalError(...args);
  };
}

interface SchemaField {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  interface?: string;
}

interface CollectionConfig {
  id: string;
  name: string;
  label: string;
  icon?: string;
  fields: SchemaField[];
  relationInfo?: any;
}

function mapTypeToOpenAPI(type: string): string {
  const mapping: Record<string, string> = {
    string: 'string',
    text: 'string',
    integer: 'integer',
    float: 'number',
    boolean: 'boolean',
    datetime: 'string',
    date: 'string',
    time: 'string',
    file: 'object',
    json: 'object',
    relation: 'integer',
    uuid: 'string',
  };
  return mapping[type] || 'string';
}

function generateOpenApiSpec(collections: Record<string, CollectionConfig>) {
  const paths: Record<string, any> = {
    '/collections': {
      get: {
        tags: ['Collections'],
        summary: 'List all collections',
        description: 'Returns a list of all available collections in the system',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Collections'],
        summary: 'Create a new collection',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        responses: {
          '201': { description: 'Collection created' },
          '400': { description: 'Invalid input' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout',
        responses: { '200': { description: 'Logged out' } },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh token',
        responses: { '200': { description: 'Token refreshed' } },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        responses: { '200': { description: 'List of users' } },
      },
      post: {
        tags: ['Users'],
        summary: 'Create user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '201': { description: 'User created' } },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'User details' }, '404': { description: 'Not found' } },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '200': { description: 'User updated' } },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'User deleted' } },
      },
    },
    '/roles': {
      get: {
        tags: ['Roles'],
        summary: 'List roles',
        responses: { '200': { description: 'List of roles' } },
      },
    },
    '/activity': {
      get: {
        tags: ['Activity'],
        summary: 'Get activity log',
        responses: { '200': { description: 'Activity log' } },
      },
    },
    '/files': {
      get: {
        tags: ['Files'],
        summary: 'List files',
        responses: { '200': { description: 'List of files' } },
      },
      post: {
        tags: ['Files'],
        summary: 'Upload file',
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: { type: 'object' } } },
        },
        responses: { '201': { description: 'File uploaded' } },
      },
    },
    '/webhooks': {
      get: {
        tags: ['Webhooks'],
        summary: 'List webhooks',
        responses: { '200': { description: 'List of webhooks' } },
      },
      post: {
        tags: ['Webhooks'],
        summary: 'Create webhook',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '201': { description: 'Webhook created' } },
      },
    },
    '/settings': {
      get: {
        tags: ['Settings'],
        summary: 'Get settings',
        responses: { '200': { description: 'Settings' } },
      },
      patch: {
        tags: ['Settings'],
        summary: 'Update settings',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '200': { description: 'Settings updated' } },
      },
    },
  };

  const schemas: Record<string, any> = {
    Error: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  };

  // Safely add collection paths
  if (collections && typeof collections === 'object') {
    Object.entries(collections).forEach(([key, collection]) => {
      if (!collection || typeof collection !== 'object') return;
      
      const singular = key.endsWith('s') ? key.slice(0, -1) : key;

    // List items
    paths[`/items/${key}`] = {
      get: {
        tags: [collection.label || key],
        summary: `List ${collection.label || key}`,
        description: `Get a paginated list of ${collection.label || key} items`,
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'sort', in: 'query', schema: { type: 'string' }, description: 'Field to sort by (prefix with - for descending)' },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'filter', in: 'query', schema: { type: 'string' }, description: 'JSON filter object' },
        ],
        responses: {
          '200': {
            description: `List of ${collection.label || key}`,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: `#/components/schemas/${singular}` } },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: [collection.label || key],
        summary: `Create ${collection.label || key}`,
        description: `Create a new item in ${collection.label || key}`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${singular}Create` },
            },
          },
        },
        responses: {
          '201': { description: 'Item created' },
          '400': { description: 'Invalid data' },
        },
      },
    };

    // Get/Update/Delete single item
    paths[`/items/${key}/{id}`] = {
      get: {
        tags: [collection.label || key],
        summary: `Get ${collection.label || key}`,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: `${collection.label || key} details`, content: { 'application/json': { schema: { $ref: `#/components/schemas/${singular}` } } } },
          '404': { description: 'Not found' },
        },
      },
      patch: {
        tags: [collection.label || key],
        summary: `Update ${collection.label || key}`,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: `#/components/schemas/${singular}Update` } } },
        },
        responses: {
          '200': { description: 'Item updated' },
          '404': { description: 'Not found' },
        },
      },
      delete: {
        tags: [collection.label || key],
        summary: `Delete ${collection.label || key}`,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Item deleted' },
          '404': { description: 'Not found' },
        },
      },
    };

    // Generate schemas for this collection
    const requiredFields = collection.fields.filter(f => f.required).map(f => f.name);
    const properties: Record<string, any> = {};

    collection.fields.forEach(field => {
      properties[field.name] = {
        type: mapTypeToOpenAPI(field.type),
        description: field.label,
        example: getExampleValue(field),
      };
    });

    schemas[singular] = {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'Primary key' },
        ...properties,
        date_created: { type: 'string', format: 'date-time' },
        date_updated: { type: 'string', format: 'date-time' },
      },
    };

    schemas[`${singular}Create`] = {
      type: 'object',
      required: requiredFields.length > 0 ? requiredFields : undefined,
      properties,
    };

    schemas[`${singular}Update`] = {
      type: 'object',
      properties,
    };
    });
  }

  schemas['PaginationMeta'] = {
    type: 'object',
    properties: {
      total_count: { type: 'integer' },
      filter_count: { type: 'integer' },
      limit: { type: 'integer' },
      offset: { type: 'integer' },
    },
  };

  return {
    openapi: '3.0.3',
    info: {
      title: 'Neurofy CMS API',
      description: `Complete REST API with ${Object.keys(collections).length} collections.\n\nManage collections, items, files, users, roles, permissions, webhooks, and more.`,
      version: '1.0.0',
    },
    servers: [
      { url: '/api', description: 'Current server' },
    ],
    tags: [
      { name: 'Collections', description: 'Collection management' },
      { name: 'Authentication', description: 'Login and auth' },
      { name: 'Users', description: 'User management' },
      { name: 'Roles', description: 'Role management' },
      { name: 'Activity', description: 'Activity logs' },
      { name: 'Files', description: 'File management' },
      { name: 'Webhooks', description: 'Webhook configuration' },
      { name: 'Settings', description: 'App settings' },
      ...Object.values(collections).map(c => ({ name: c.label || c.name, description: `${c.label || c.name} collection` })),
    ],
    paths,
    components: {
      schemas,
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  };
}

function getExampleValue(field: SchemaField): any {
  switch (field.type) {
    case 'string': return `example_${field.name}`;
    case 'text': return 'Sample text content...';
    case 'integer': return 1;
    case 'float': return 1.5;
    case 'boolean': return true;
    case 'datetime': return '2024-03-15T10:30:00Z';
    case 'date': return '2024-03-15';
    case 'time': return '10:30:00';
    case 'file': return { id: 1, filename: 'image.jpg' };
    case 'json': return { key: 'value' };
    case 'relation': return 1;
    default: return 'value';
  }
}

export default function ApiDocsPage() {
  const { collections, loading, fetchSchema } = useSchemaStore();
  const [activeTab, setActiveTab] = useState(0);
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    if (!collections || typeof collections !== 'object' || Object.keys(collections).length === 0) {
      fetchSchema();
    }
  }, []);

  useEffect(() => {
    if (collections && typeof collections === 'object' && Object.keys(collections).length > 0) {
      try {
        setSpec(generateOpenApiSpec(collections));
      } catch (err) {
        console.error('Error generating OpenAPI spec:', err);
      }
    }
  }, [collections]);

  const collectionCount = collections && typeof collections === 'object' ? Object.keys(collections).length : 0;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ px: 3, pt: 2 }}>
          <Typography variant='h5' fontWeight={700} gutterBottom>
            API Documentation
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant='body2' color='text.secondary'>
              Interactive API explorer with OpenAPI 3.0 specification
            </Typography>
            {collectionCount > 0 && (
              <Chip
                label={`${collectionCount} collections`}
                size='small'
                sx={{ height: 20, fontSize: 11 }}
              />
            )}
          </Box>
        </Box>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2 }}>
          <Tab label='Swagger UI' />
          <Tab label='Quick Reference' />
          <Tab label='Authentication' />
        </Tabs>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {activeTab === 0 && (
          loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <CircularProgress />
            </Box>
          ) : spec ? (
            <Box sx={{ height: 'calc(100vh - 200px)' }}>
              <SwaggerUI spec={spec} deepLinking tryItOutEnabled />
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color='text.secondary'>No collections found. Create some collections first.</Typography>
            </Box>
          )
        )}

        {activeTab === 1 && (
          <Box sx={{ p: 4, maxWidth: 900 }}>
            <Typography variant='h6' fontWeight={700} gutterBottom>
              Quick Reference
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='subtitle2' fontWeight={700} gutterBottom>
                Base URL
              </Typography>
              <Typography component='code' sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1 }}>
                /api
              </Typography>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='subtitle2' fontWeight={700} gutterBottom>
                Authentication
              </Typography>
              <Typography variant='body2' color='text.secondary' paragraph>
                Include JWT token in Authorization header:
              </Typography>
              <Typography component='code' sx={{ fontFamily: 'monospace', display: 'block', bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                Authorization: Bearer &lt;your-token&gt;
              </Typography>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='subtitle2' fontWeight={700} gutterBottom>
                Common Endpoints
              </Typography>
              <Box component='table' sx={{ width: '100%', '& td, & th': { py: 1, px: 2, borderBottom: 1, borderColor: 'divider' } }}>
                <Box component='thead'>
                  <Box component='tr'>
                    <Box component='th' sx={{ textAlign: 'left', fontWeight: 600 }}>Method</Box>
                    <Box component='th' sx={{ textAlign: 'left', fontWeight: 600 }}>Endpoint</Box>
                    <Box component='th' sx={{ textAlign: 'left', fontWeight: 600 }}>Description</Box>
                  </Box>
                </Box>
                <Box component='tbody'>
                  <Box component='tr'>
                    <Box component='td'><Chip label='GET' size='small' color='success' sx={{ fontWeight: 700 }} /></Box>
                    <Box component='td'><Typography component='code' sx={{ fontFamily: 'monospace', fontSize: 12 }}>/collections</Typography></Box>
                    <Box component='td'>List all collections</Box>
                  </Box>
                  <Box component='tr'>
                    <Box component='td'><Chip label='GET' size='small' color='success' sx={{ fontWeight: 700 }} /></Box>
                    <Box component='td'><Typography component='code' sx={{ fontFamily: 'monospace', fontSize: 12 }}>/items/:collection</Typography></Box>
                    <Box component='td'>List items with pagination</Box>
                  </Box>
                  <Box component='tr'>
                    <Box component='td'><Chip label='POST' size='small' color='primary' sx={{ fontWeight: 700 }} /></Box>
                    <Box component='td'><Typography component='code' sx={{ fontFamily: 'monospace', fontSize: 12 }}>/items/:collection</Typography></Box>
                    <Box component='td'>Create new item</Box>
                  </Box>
                  <Box component='tr'>
                    <Box component='td'><Chip label='GET' size='small' color='success' sx={{ fontWeight: 700 }} /></Box>
                    <Box component='td'><Typography component='code' sx={{ fontFamily: 'monospace', fontSize: 12 }}>/users</Typography></Box>
                    <Box component='td'>List all users</Box>
                  </Box>
                  <Box component='tr'>
                    <Box component='td'><Chip label='GET' size='small' color='success' sx={{ fontWeight: 700 }} /></Box>
                    <Box component='td'><Typography component='code' sx={{ fontFamily: 'monospace', fontSize: 12 }}>/files</Typography></Box>
                    <Box component='td'>List all files</Box>
                  </Box>
                  <Box component='tr'>
                    <Box component='td'><Chip label='GET' size='small' color='success' sx={{ fontWeight: 700 }} /></Box>
                    <Box component='td'><Typography component='code' sx={{ fontFamily: 'monospace', fontSize: 12 }}>/activity</Typography></Box>
                    <Box component='td'>Get activity log</Box>
                  </Box>
                  <Box component='tr'>
                    <Box component='td'><Chip label='GET' size='small' color='success' sx={{ fontWeight: 700 }} /></Box>
                    <Box component='td'><Typography component='code' sx={{ fontFamily: 'monospace', fontSize: 12 }}>/roles</Typography></Box>
                    <Box component='td'>List all roles</Box>
                  </Box>
                  {Object.entries(collections || {}).slice(0, 5).map(([key, col]) => (
                    <Box component='tr' key={key}>
                      <Box component='td'><Chip label='GET' size='small' color='success' sx={{ fontWeight: 700 }} /></Box>
                      <Box component='td'><Typography component='code' sx={{ fontFamily: 'monospace', fontSize: 12 }}>/items/{key}</Typography></Box>
                      <Box component='td'>List {col.label || key}</Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ p: 4, maxWidth: 800 }}>
            <Typography variant='h6' fontWeight={700} gutterBottom>
              Authentication Guide
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='subtitle2' fontWeight={700} gutterBottom>
                1. Login to get JWT token
              </Typography>
              <Paper variant='outlined' sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography component='pre' sx={{ fontFamily: 'monospace', fontSize: 13, m: 0 }}>
{`POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your-password"
}`}
                </Typography>
              </Paper>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
                Response includes a JWT token in an HTTP-only cookie.
              </Typography>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='subtitle2' fontWeight={700} gutterBottom>
                2. Use the token in requests
              </Typography>
              <Paper variant='outlined' sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography component='pre' sx={{ fontFamily: 'monospace', fontSize: 13, m: 0 }}>
{`GET /api/items/posts
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Accept: application/json`}
                </Typography>
              </Paper>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant='subtitle2' fontWeight={700} gutterBottom>
                3. Logout
              </Typography>
              <Paper variant='outlined' sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography component='pre' sx={{ fontFamily: 'monospace', fontSize: 13, m: 0 }}>
{`POST /api/auth/logout`}
                </Typography>
              </Paper>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}
