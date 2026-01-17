import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    fetchProducts, createProduct, deleteProduct, 
    fetchUnits, createUnit, deleteUnit, 
    fetchStops, createStop, deleteStop, updateStop,
    Product, SavedStop, SavedStopCreate 
} from "../api/catalog";

export const useProducts = () => {
    const queryClient = useQueryClient();

    const { data: products = [], isLoading } = useQuery({
        queryKey: ["products"],
        queryFn: fetchProducts,
    });

    const addMutation = useMutation({
        mutationFn: createProduct,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    });

    const removeMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    });

    // Format for ProductCard (Name ES/Name EN)
    const productOptions = products.map((p: Product) => p.name_en ? `${p.name_es}/${p.name_en}` : p.name_es);

    return {
        products, // Raw objects with IDs
        productOptions, // Formatted strings for dropdowns
        isLoading,
        addProduct: addMutation.mutateAsync,
        removeProduct: removeMutation.mutateAsync,
    };
};

export const useUnits = () => {
    const queryClient = useQueryClient();

    const { data: units = [], isLoading } = useQuery({
        queryKey: ["units"],
        queryFn: fetchUnits,
    });

    const addMutation = useMutation({
        mutationFn: createUnit,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["units"] }),
    });

    const removeMutation = useMutation({
        mutationFn: deleteUnit,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["units"] }),
    });

    return {
        units,
        isLoading,
        addUnit: addMutation.mutateAsync,
        removeUnit: removeMutation.mutateAsync,
    };
};

export const useStops = () => {
    const queryClient = useQueryClient();

    const { data: stops = [], isLoading } = useQuery({
        queryKey: ["saved-stops"],
        queryFn: () => fetchStops(),
    });

    const addMutation = useMutation({
        mutationFn: createStop,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-stops"] }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<SavedStopCreate> }) => updateStop(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-stops"] }),
    });

    const removeMutation = useMutation({
        mutationFn: deleteStop,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-stops"] }),
    });

    // Función para buscar paradas por nombre (para autocompletado)
    const searchStops = (search: string): SavedStop[] => {
        if (!search) return stops;
        const lower = search.toLowerCase();
        return stops.filter((s: SavedStop) => 
            s.name.toLowerCase().includes(lower) || 
            s.address?.toLowerCase().includes(lower) ||
            s.city?.toLowerCase().includes(lower)
        );
    };

    return {
        stops,
        isLoading,
        searchStops,
        addStop: addMutation.mutateAsync,
        updateStop: updateMutation.mutateAsync,
        removeStop: removeMutation.mutateAsync,
    };
};
