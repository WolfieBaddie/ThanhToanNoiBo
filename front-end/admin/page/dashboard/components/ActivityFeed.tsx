import type { FC } from 'react';

const ActivityFeed: FC = () => {
  const activities = [
    { user: 'John Smith', action: 'made a payment', amount: '$12.50', time: '2 min ago', icon: '💳' },
    { user: 'System', action: 'daily report generated', time: '1 hour ago', icon: '/analytics.svg' },
    { user: 'Emma Johnson', action: 'added balance', amount: '$50.00', time: '3 hours ago', icon: '💰' },
    { user: 'Admin', action: 'updated service prices', time: '5 hours ago', icon: '⚡' },
    { user: 'Michael Brown', action: 'ordered lunch', amount: '$5.99', time: '1 day ago', icon: '🍔' },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 animate-slideUp">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Recent Activity</h3>
          <p className="text-white/60 text-sm mt-1">Latest system activities</p>
        </div>
        <button className="text-purple-400 hover:text-purple-300 transition-colors">
          View All →
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div 
            key={index}
            className="flex items-center space-x-4 p-4 rounded-xl bg-linear-to-r from-white/5 to-transparent border border-white/5 hover:border-purple-500/30 transition-all duration-300 group animate-fadeIn"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="p-3 rounded-xl bg-linear-to-br from-purple-500/20 to-blue-500/20 border border-white/10 group-hover:scale-110 transition-transform duration-300">
              {activity.icon.startsWith('/') ? (
                <img src={activity.icon} alt="" className="w-6 h-6" />
              ) : (
                <span className="text-lg">{activity.icon}</span>
              )}
            </div>
            
            <div className="flex-1">
              <p className="text-white/90">
                <span className="font-bold">{activity.user}</span> {activity.action}
                {activity.amount && <span className="text-purple-400"> ({activity.amount})</span>}
              </p>
              <p className="text-white/40 text-sm mt-1">{activity.time}</p>
            </div>
            
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;