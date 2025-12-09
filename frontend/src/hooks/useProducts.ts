import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProducts, createProduct, deleteProduct, fetchUnits, createUnit, deleteUnit, Product } from "../api/catalog";

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
