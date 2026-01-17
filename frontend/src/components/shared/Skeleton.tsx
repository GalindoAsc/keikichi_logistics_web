import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
    <div className={`animate-pulse bg-keikichi-lime-100 dark:bg-keikichi-forest-700 rounded ${className}`} />
);

export const QuoteCardSkeleton: React.FC = () => (
    <div className="p-6 border-b border-keikichi-lime-50 dark:border-keikichi-forest-600">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1 space-y-3">
                {/* Status badges */}
                <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-5 w-16" />
                </div>
                {/* Route */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-6 w-48" />
                </div>
                {/* Meta info */}
                <div className="flex items-center gap-6">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                </div>
                {/* Date */}
                <Skeleton className="h-3 w-40" />
            </div>
            {/* Price box */}
            <div className="lg:text-right space-y-3">
                <div className="rounded-lg p-4 border border-keikichi-lime-200 dark:border-keikichi-forest-600">
                    <Skeleton className="h-3 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                </div>
            </div>
        </div>
    </div>
);

export const TripCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-keikichi-forest-800 rounded-lg border border-keikichi-lime-100 dark:border-keikichi-forest-600 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-6 w-56" />
                </div>
                <div className="flex gap-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
        </div>
    </div>
);

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
    <tr>
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-full" />
            </td>
        ))}
    </tr>
);

export default Skeleton;
