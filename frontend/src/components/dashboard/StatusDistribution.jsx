const statuses = [
  { key: 'TODO', label: 'To Do', color: 'bg-[#666666]' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-500' },
  { key: 'IN_REVIEW', label: 'In Review', color: 'bg-yellow-500' },
  { key: 'DONE', label: 'Done', color: 'bg-green-500' }
];

export default function StatusDistribution({ distribution }) {
  const total = distribution ? Object.values(distribution).reduce((acc, curr) => acc + curr, 0) : 0;

  if (total === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">
        No tasks available
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col justify-center px-2">
      <div className="space-y-4">
        {statuses.map(status => {
          const count = distribution[status.key] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          
          return (
            <div key={status.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12 text-right">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Progress bar visual */}
      <div className="mt-8 h-2 w-full flex rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        {statuses.map(status => {
          const count = distribution[status.key] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          if (percentage === 0) return null;
          
          return (
            <div 
              key={`${status.key}-bar`}
              style={{ width: `${percentage}%` }}
              className={`h-full ${status.color} border-r border-white  last:border-0`}
            ></div>
          );
        })}
      </div>
    </div>
  );
}
