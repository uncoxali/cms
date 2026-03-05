export type PanelType = 'metric' | 'chart-bar' | 'chart-pie' | 'list';

export interface PanelConfig {
    id: string;
    type: PanelType;
    title: string;
    collection?: string; // Which collection data is pulled from
    query?: any; // The filter/metrics query representation
    position: { x: number; y: number; w: number; h: number };
}

export const defaultDashboardsPanels: PanelConfig[] = [
    {
        id: 'p1',
        type: 'metric',
        title: 'Total Products',
        collection: 'products',
        query: { aggregate: 'count' },
        position: { x: 0, y: 0, w: 2, h: 1 }
    },
    {
        id: 'p2',
        type: 'metric',
        title: 'Total Categories',
        collection: 'categories',
        query: { aggregate: 'count' },
        position: { x: 2, y: 0, w: 2, h: 1 }
    },
    {
        id: 'p3',
        type: 'chart-pie',
        title: 'Active vs Archived',
        collection: 'products',
        query: { groupBy: 'isActive' },
        position: { x: 0, y: 1, w: 2, h: 2 }
    },
    {
        id: 'p4',
        type: 'list',
        title: 'Recent Products',
        collection: 'products',
        query: { limit: 5, sort: '-createdAt' },
        position: { x: 2, y: 1, w: 2, h: 2 }
    }
];
