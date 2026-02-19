import React from 'react'

interface SkeletonProps {
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-700 rounded ${className}`} />
)

export const CardSkeleton: React.FC = () => (
  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
    <div className="flex items-center gap-3 mb-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-3 w-full mb-2" />
    <Skeleton className="h-3 w-2/3" />
  </div>
)

export const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-gray-700">
    <td className="py-3 px-3"><Skeleton className="h-4 w-20" /></td>
    <td className="py-3 px-3"><Skeleton className="h-4 w-32" /></td>
    <td className="py-3 px-3"><Skeleton className="h-4 w-16" /></td>
    <td className="py-3 px-3"><Skeleton className="h-4 w-24" /></td>
  </tr>
)

export const StatCardSkeleton: React.FC = () => (
  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
    <Skeleton className="h-4 w-24 mb-2" />
    <Skeleton className="h-8 w-16" />
    <Skeleton className="h-3 w-20 mt-2" />
  </div>
)

export const ChartSkeleton: React.FC = () => (
  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
    <Skeleton className="h-6 w-48 mb-4" />
    <div className="flex gap-4">
      <div className="flex-1 space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <Skeleton className="w-32 h-32 rounded-full" />
    </div>
  </div>
)

export const IncidentCardSkeleton: React.FC = () => (
  <div className="bg-gray-700 rounded-lg p-3">
    <div className="flex justify-between items-start mb-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-5 w-16" />
    </div>
    <Skeleton className="h-4 w-1/2 mb-2" />
    <Skeleton className="h-3 w-full" />
  </div>
)

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <IncidentCardSkeleton key={i} />
    ))}
  </div>
)

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (<StatCardSkeleton key={i} />))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ChartSkeleton />
      </div>
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <Skeleton className="h-6 w-48 mb-4" />
          <ListSkeleton count={4} />
        </div>
      </div>
    </div>
  </div>
)

export default Skeleton
