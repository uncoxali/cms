import {
    LayoutDashboard,
    Database,
    FolderOpen,
    Users,
    Settings,
    Activity,
    LucideIcon
} from 'lucide-react';

export interface AppModule {
    id: string;
    name: string;
    icon: LucideIcon;
    path: string;
    component?: any; // Component reference if loaded dynamically, not strictly needed for this scaffold
    permissionsRequired: string[]; // Roles that can see this module
    version: string;
    author: string;
}

export interface DashboardPanelType {
    id: string;
    name: string;
    icon: string;
    defaultConfig: any;
    version: string;
    author: string;
}

export interface FieldInterface {
    id: string;
    name: string;
    icon: string;
    supportedTypes: string[]; // E.g., ['string', 'text']
    version: string;
    author: string;
}

export const ExtensionRegistry = {
    modules: [
        {
            id: 'dashboard',
            name: 'Insights',
            icon: LayoutDashboard,
            path: '/admin/dashboard',
            permissionsRequired: ['admin', 'editor', 'viewer'],
            version: '1.0.0',
            author: 'Core'
        },
        {
            id: 'content',
            name: 'Content',
            icon: Database,
            path: '/admin/content',
            permissionsRequired: ['admin', 'editor', 'viewer'],
            version: '1.0.0',
            author: 'Core'
        },
        {
            id: 'files',
            name: 'File Library',
            icon: FolderOpen,
            path: '/admin/files',
            permissionsRequired: ['admin', 'editor', 'viewer'],
            version: '1.0.0',
            author: 'Core'
        },
        {
            id: 'users',
            name: 'User Directory',
            icon: Users,
            path: '/admin/users',
            permissionsRequired: ['admin'],
            version: '1.0.0',
            author: 'Core'
        },
        {
            id: 'flows',
            name: 'Automations',
            icon: FolderOpen,
            path: '/admin/flows',
            permissionsRequired: ['admin'],
            version: '1.0.0',
            author: 'Core'
        },
        {
            id: 'settings',
            name: 'Settings',
            icon: Settings,
            path: '/admin/settings',
            permissionsRequired: ['admin'],
            version: '1.0.0',
            author: 'Core'
        },
        {
            id: 'activity',
            name: 'Activity Logs',
            icon: Activity,
            path: '/admin/activity',
            permissionsRequired: ['admin'],
            version: '1.0.0',
            author: 'Core'
        },
    ] as AppModule[],

    panels: [
        { id: 'metric', name: 'Metric', icon: 'Hash', defaultConfig: { value: 0 }, version: '1.0.0', author: 'Core' },
        { id: 'list', name: 'List', icon: 'List', defaultConfig: { limit: 5 }, version: '1.0.0', author: 'Core' },
        { id: 'time-series', name: 'Time Series Chart', icon: 'LineChart', defaultConfig: {}, version: '1.0.0', author: 'Core' },
        { id: 'markdown', name: 'Markdown Note', icon: 'FileText', defaultConfig: { content: '' }, version: '1.0.0', author: 'Core' },
    ] as DashboardPanelType[],

    interfaces: [
        { id: 'input', name: 'Text Input', icon: 'Type', supportedTypes: ['string'], version: '1.0.0', author: 'Core' },
        { id: 'textarea', name: 'Text Area', icon: 'AlignLeft', supportedTypes: ['text'], version: '1.0.0', author: 'Core' },
        { id: 'boolean', name: 'Toggle', icon: 'ToggleRight', supportedTypes: ['boolean'], version: '1.0.0', author: 'Core' },
        { id: 'select-dropdown', name: 'Dropdown', icon: 'ChevronDownSquare', supportedTypes: ['string', 'integer'], version: '1.0.0', author: 'Core' },
        { id: 'datetime', name: 'Datetime', icon: 'Calendar', supportedTypes: ['timestamp', 'datetime'], version: '1.0.0', author: 'Core' },
    ] as FieldInterface[]
};
