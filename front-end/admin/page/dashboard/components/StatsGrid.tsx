import type { FC } from 'react';
// Make sure StatsCard is also exported correctly in its own file!
import StatsCard from './StatsCard';

// Added 'export' keyword directly here
export const StatsGrid: FC = () => {
    const stats = [
        {
            title: 'Total Revenue',
            value: '$45,231.89',
            change: '+20.1%',
            icon: '/money.svg',
            color: 'from-green-500/20 to-emerald-500/20',
            borderColor: 'border-green-500/30',
            trend: 'up' as const
        },
        {
            title: 'Total Orders',
            value: '2,356',
            change: '+15.3%',
            icon: '📦',
            color: 'from-blue-500/20 to-cyan-500/20',
            borderColor: 'border-blue-500/30',
            trend: 'up' as const
        },
        {
            title: 'Active Users',
            value: '1,234',
            change: '+8.2%',
            icon: '👥',
            color: 'from-purple-500/20 to-pink-500/20',
            borderColor: 'border-purple-500/30',
            trend: 'up' as const
        },
        {
            title: 'Services',
            value: '24',
            change: '+3',
            icon: '/service.svg',
            color: 'from-orange-500/20 to-yellow-500/20',
            borderColor: 'border-orange-500/30',
            trend: 'up' as const
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((stat, index) => (
                // Ensure StatsCard can accept these props
                <StatsCard key={index} {...stat} delay={index * 100} />
            ))}
        </div>
    );
};
