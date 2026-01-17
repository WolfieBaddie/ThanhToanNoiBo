
import React from 'react';

export const MenuHeader: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Dịch vụ & Món ăn</h1>
        <p className="text-slate-500 dark:text-slate-400">Khám phá các dịch vụ có sẵn trong trường.</p>
      </div>
    </div>
  );
};
