import { create } from 'zustand';
import { api } from '@/lib/api';

export type TriggerType = 'hook' | 'webhook' | 'schedule' | 'operation' | 'manual';
export type OperationType = 'exec' | 'mail' | 'notification' | 'log' | 'request' | 'sleep' | 'condition' | 'transform' | 'item.create' | 'item.update' | 'item.delete' | 'item.read' | 'create-item' | 'update-item' | 'delete-item' | 'send-request' | 'send-email' | 'transform-data' | 'run-flow';
export type FlowStatus = 'active' | 'inactive';
export type FlowPermission = '$full' | '$trigger' | '$public' | string;

export interface TriggerOptions {
    collection?: string;
    event?: string;
    webhookUrl?: string;
    webhookSecret?: string;
    cronExpression?: string;
    cronTimezone?: string;
    sourceFlowId?: string;
}

export interface FlowOperation {
    id: string;
    key: string;
    name: string;
    type: OperationType;
    options: any;
    resolve?: string;
    reject?: string;
}

export interface Flow {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    status: FlowStatus;
    triggerType: TriggerType;
    triggerOptions: TriggerOptions;
    permission: FlowPermission;
    operations: FlowOperation[];
    dateCreated: string;
    userCreated: string;
    dateUpdated: string;
    userUpdated: string;
}

export interface FlowRunLog {
    id: string;
    flowId: string;
    flowName: string;
    triggerType: TriggerType;
    status: 'success' | 'error';
    timestamp: string;
    duration: number;
    operationsRun: number;
    triggerPayload?: any;
    accountability?: any;
    operationResults?: { operationKey: string; status: 'success' | 'error'; output?: any; error?: string }[];
    errorMessage?: string;
}

interface FlowsState {
    flows: Flow[];
    runLogs: FlowRunLog[];
    loading: boolean;
    fetchFlows: () => Promise<void>;
    fetchFlowDetail: (id: string) => Promise<Flow & { logs: FlowRunLog[] } | null>;
    addFlow: (flow: Partial<Flow>) => Promise<string | null>;
    updateFlow: (id: string, updates: Partial<Flow>) => Promise<void>;
    deleteFlow: (id: string) => Promise<void>;
    addOperation: (flowId: string, op: FlowOperation) => void;
    updateOperation: (flowId: string, opId: string, updates: Partial<FlowOperation>) => void;
    deleteOperation: (flowId: string, opId: string) => void;
    addRunLog: (log: FlowRunLog) => void;
}

function mapDbFlow(f: any): Flow {
    return {
        id: f.id,
        name: f.name,
        description: f.description || '',
        icon: f.icon || 'Zap',
        color: f.color || '#6644ff',
        status: f.status || 'active',
        triggerType: f.trigger_type || 'manual',
        triggerOptions: f.trigger_options || {},
        permission: f.permission || '$full',
        operations: f.operations || [],
        dateCreated: f.created_at || new Date().toISOString(),
        userCreated: f.user_created || 'Admin User',
        dateUpdated: f.updated_at || new Date().toISOString(),
        userUpdated: f.user_updated || 'Admin User',
    };
}

function mapDbLog(l: any, flowName: string): FlowRunLog {
    return {
        id: String(l.id),
        flowId: l.flow_id,
        flowName,
        triggerType: l.trigger_type || 'manual',
        status: l.status || 'success',
        timestamp: l.started_at,
        duration: l.duration || 0,
        operationsRun: (l.steps || []).length,
        operationResults: l.steps || [],
        errorMessage: l.error || undefined,
    };
}

export const useFlowsStore = create<FlowsState>()((set, get) => ({
    flows: [],
    runLogs: [],
    loading: false,

    fetchFlows: async () => {
        if (get().loading) return;
        set({ loading: true });
        try {
            const token = api.getToken();
            if (!token) { set({ loading: false }); return; }
            const res = await api.get<{ data: any[] }>('/flows');
            const flows = (res.data || []).map(mapDbFlow);
            set({ flows, loading: false });
        } catch (err) {
            console.error('[FlowsStore] fetch error:', err);
            set({ loading: false });
        }
    },

    fetchFlowDetail: async (id: string) => {
        try {
            const token = api.getToken();
            if (!token) return null;
            const res = await api.get<{ data: any }>(`/flows/${id}`);
            const flow = mapDbFlow(res.data);
            const logs = (res.data.logs || []).map((l: any) => mapDbLog(l, flow.name));
            // Update local state
            set((state) => ({
                flows: state.flows.map(f => f.id === id ? flow : f),
                runLogs: [...state.runLogs.filter(l => l.flowId !== id), ...logs],
            }));
            return { ...flow, logs };
        } catch (err) {
            console.error('[FlowsStore] fetchDetail error:', err);
            return null;
        }
    },

    addFlow: async (flowData) => {
        try {
            const res = await api.post<{ data: any }>('/flows', {
                name: flowData.name,
                description: flowData.description,
                icon: flowData.icon,
                color: flowData.color,
                status: flowData.status || 'active',
                trigger_type: flowData.triggerType || 'manual',
                trigger_options: flowData.triggerOptions || {},
                operations: flowData.operations || [],
                permission: flowData.permission || '$full',
            });
            await get().fetchFlows();
            return res.data?.id;
        } catch (err) {
            console.error('[FlowsStore] add error:', err);
            return null;
        }
    },

    updateFlow: async (id, updates) => {
        try {
            const payload: any = {};
            if (updates.name !== undefined) payload.name = updates.name;
            if (updates.description !== undefined) payload.description = updates.description;
            if (updates.icon !== undefined) payload.icon = updates.icon;
            if (updates.color !== undefined) payload.color = updates.color;
            if (updates.status !== undefined) payload.status = updates.status;
            if (updates.triggerType !== undefined) payload.trigger_type = updates.triggerType;
            if (updates.triggerOptions !== undefined) payload.trigger_options = updates.triggerOptions;
            if (updates.operations !== undefined) payload.operations = updates.operations;
            if (updates.permission !== undefined) payload.permission = updates.permission;
            await api.patch(`/flows/${id}`, payload);
            await get().fetchFlows();
        } catch (err) {
            console.error('[FlowsStore] update error:', err);
        }
    },

    deleteFlow: async (id) => {
        try {
            await api.del(`/flows/${id}`);
            set((state) => ({
                flows: state.flows.filter(f => f.id !== id),
                runLogs: state.runLogs.filter(l => l.flowId !== id),
            }));
        } catch (err) {
            console.error('[FlowsStore] delete error:', err);
            throw err;
        }
    },

    // Local operations (saved via updateFlow when user clicks Save)
    addOperation: (flowId, op) => set((state) => ({
        flows: state.flows.map(f => f.id === flowId
            ? { ...f, operations: [...f.operations, op] }
            : f)
    })),

    updateOperation: (flowId, opId, updates) => set((state) => ({
        flows: state.flows.map(f => f.id === flowId
            ? { ...f, operations: f.operations.map(o => o.id === opId ? { ...o, ...updates } : o) }
            : f)
    })),

    deleteOperation: (flowId, opId) => set((state) => ({
        flows: state.flows.map(f => f.id === flowId
            ? { ...f, operations: f.operations.filter(o => o.id !== opId) }
            : f)
    })),

    addRunLog: (log) => set((state) => ({
        runLogs: [log, ...state.runLogs]
    })),
}));
