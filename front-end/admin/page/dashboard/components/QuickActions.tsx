import type { FC } from 'react';

const QuickActions: FC = () => {
  const actions = [
    { icon: '/analytics.svg', label: 'Generate Report', color: 'from-purple-500 to-blue-500' },
    { icon: '💰', label: 'Add Balance', color: 'from-green-500 to-emerald-500' },
    { icon: '📧', label: 'Send Notification', color: 'from-blue-500 to-cyan-500' },
    { icon: '⚡', label: 'System Check', color: 'from-orange-500 to-yellow-500' },
    { icon: '🔧', label: 'Settings', color: 'from-gray-500 to-gray-700' },
    { icon: '📤', label: 'Export Data', color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 animate-slideUp">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white">Quick Actions</h3>
        <p className="text-white/60 text-sm mt-1">Frequently used actions</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`group relative overflow-hidden p-4 rounded-xl bg-linear-to-br ${action.color}/20 border border-white/10 hover:scale-105 transition-all duration-300 animate-fadeInUp`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex flex-col items-center space-y-2">
              <div className={`p-3 rounded-xl bg-linear-to-br ${action.color} border border-white/20`}>
                {action.icon.startsWith('/') ? (
                  <img src={action.icon} alt="" className="w-5 h-5" />
                ) : (
                  <span className="text-xl">{action.icon}</span>
                )}
              </div>
              <span className="text-sm font-medium text-white/90">{action.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;