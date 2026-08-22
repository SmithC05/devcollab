import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

export default function TasksCompletedChart({ data }) {
  // Check if we actually have completed tasks
  const hasData = data && data.some(d => d.count > 0);
  
  // If empty, generate the 7-day empty state data
  const chartData = hasData ? data.map(item => ({
    name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    count: item.count
  })) : [
    { name: 'Tue', count: 0 },
    { name: 'Wed', count: 0 },
    { name: 'Thu', count: 0 },
    { name: 'Fri', count: 0 },
    { name: 'Sat', count: 0 },
    { name: 'Sun', count: 0 },
    { name: 'Mon', count: 0 },
  ];

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.5} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#666666', fontSize: 9 }} 
            dy={5}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#666666', fontSize: 9 }} 
            domain={[0, 4]}
            ticks={[0, 1, 2, 3, 4]}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke={hasData ? "#FFFFFF" : "#666666"} 
            strokeWidth={1}
            dot={{ r: 3, fill: hasData ? "#FFFFFF" : "#E5E5E5", strokeWidth: 0 }}
            activeDot={{ r: 4 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
