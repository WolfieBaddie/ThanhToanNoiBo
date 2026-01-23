import type { FC } from 'react';
import { useState } from 'react';

const DashboardHeader: FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 animate-fadeIn">
      {/* Left Section - Title & Stats */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold bg-linear-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-4">
          Dashboard
        </h1>
        
        {/* Quick Stats */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-linear-to-r from-purple-500/20 to-blue-500/20 border border-white/10">
              <span className="text-lg">👥</span>
            </div>
            <div>
              <p className="text-white/60 text-sm">Users</p>
              <p className="text-white font-bold text-xl">12</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-linear-to-r from-green-500/20 to-emerald-500/20 border border-white/10">
              <img src="/service.svg" alt="" className='w-7 h-7'/>
            </div>
            <div>
              <p className="text-white/60 text-sm">Services</p>
              <p className="text-white font-bold text-xl">45</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-linear-to-r from-orange-500/20 to-yellow-500/20 border border-white/10">
              <span className="text-lg">📦</span>
            </div>
            <div>
              <p className="text-white/60 text-sm">Orders</p>
              <p className="text-white font-bold text-xl">45</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-linear-to-r from-cyan-500/20 to-blue-500/20 border border-white/10">
              <img src="/analytics.svg" alt="" className="w-7 h-7" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Analytics</p>
              <p className="text-white font-bold text-xl">45</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Search & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Search Bar */}
        <div className="relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="pl-12 pr-4 py-3 w-full sm:w-64 rounded-2xl bg-black/40 border border-white/10 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-white placeholder-white/40"
          />
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 group-hover:text-purple-400 transition-colors">
            🔍
          </span>
        </div>

        {/* Date Range Filter */}
        <div className="flex gap-2">
          <button className="px-4 py-3 rounded-2xl bg-linear-to-r from-purple-500/20 to-blue-500/20 border border-white/10 text-white font-medium hover:scale-105 transition-transform text-sm">
            This Month
          </button>
          <button className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white font-medium hover:scale-105 transition-transform text-sm">
            Custom Range
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;