import api from "./client";

export interface Product {
    id: number;
    name_es: string;
    name_en?: string;
    is_active: boolean;
}

export interface Unit {
    id: number;
    name: string;
    abbreviation?: string;
    is_active: boolean;
}

export const fetchProducts = async () => {
    const { data } = await api.get<Product[]>("/catalog/products");
    return data;
};

export const createProduct = async (product: { name_es: string; name_en?: string }) => {
    const { data } = await api.post<Product>("/catalog/products", product);
    return data;
};

export const deleteProduct = async (id: number) => {
    await api.delete(`/catalog/products/${id}`);
};

export const fetchUnits = async () => {
    const { data } = await api.get<Unit[]>("/catalog/units");
    return data;
};

export const createUnit = async (unit: { name: string; abbreviation?: string }) => {
    const { data } = await api.post<Unit>("/catalog/units", unit);
    return data;
};

export const deleteUnit = async (id: number) => {
    await api.delete(`/catalog/units/${id}`);
};
