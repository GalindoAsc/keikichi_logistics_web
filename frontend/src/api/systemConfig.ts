import api from "./client";

export interface SystemConfig {
    id: string;
    key: string;
    value: string;
    value_type: string;
    description?: string;
}

export const fetchSystemConfigs = async (): Promise<SystemConfig[]> => {
    const { data } = await api.get<SystemConfig[]>("/system-config/");
    return data;
};

export const fetchSystemConfig = async (key: string): Promise<SystemConfig> => {
    const { data } = await api.get<SystemConfig>(`/system-config/${key}`);
    return data;
};

export const updateSystemConfig = async (key: string, value: string): Promise<SystemConfig> => {
    const { data } = await api.put<SystemConfig>(`/system-config/${key}`, { value });
    return data;
};
