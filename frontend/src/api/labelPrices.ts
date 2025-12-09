import api from "./client";

export interface LabelPrice {
    id: string;
    dimensions: string;
    price: number;
    description?: string;
}

export interface LabelPriceCreate {
    dimensions: string;
    price: number;
    description?: string;
}

export interface LabelPriceUpdate {
    dimensions?: string;
    price?: number;
    description?: string;
}

export const fetchLabelPrices = async (): Promise<LabelPrice[]> => {
    const { data } = await api.get<LabelPrice[]>("/label-prices/");
    return data;
};

export const createLabelPrice = async (data: LabelPriceCreate): Promise<LabelPrice> => {
    const { data: response } = await api.post<LabelPrice>("/label-prices/", data);
    return response;
};

export const updateLabelPrice = async (id: string, data: LabelPriceUpdate): Promise<LabelPrice> => {
    const { data: response } = await api.patch<LabelPrice>(`/label-prices/${id}`, data);
    return response;
};

export const deleteLabelPrice = async (id: string): Promise<void> => {
    await api.delete(`/label-prices/${id}`);
};
