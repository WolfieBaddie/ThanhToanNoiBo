import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import DashboardPage from './components/DashboardPage';
import WalletPage from './components/WalletPage';
import MenuPage from './components/MenuPage';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import VoucherPage from './components/VoucherPage';
import { TransactionDetailPage } from './components/TransactionDetailPage';
import { MainLayout } from './components/layout/MainLayout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  
  // Initialize dark mode from localStorage or system preference
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('dashboard'); // Reset tab on logout
    setSelectedTransactionId(null);
  };

  const handleViewTransactionDetail = (id: number) => {
      setSelectedTransactionId(id);
      setActiveTab('transaction-detail');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
            <DashboardPage 
                onNavigate={setActiveTab} 
                onViewTransaction={handleViewTransactionDetail} 
            />
        );
      case 'wallet':
        return <WalletPage />;
      case 'voucher':
        return <VoucherPage />;
      case 'services': // Updated ID from 'menu'
        return <MenuPage />;
      case 'history':
        return <HistoryPage onViewDetail={handleViewTransactionDetail} />;
      case 'settings':
        return <SettingsPage onLogout={handleLogout} isDarkMode={darkMode} onToggleTheme={toggleTheme} />;
      case 'transaction-detail':
        return <TransactionDetailPage onBack={() => setActiveTab('history')} transactionId={selectedTransactionId} />;
      default:
        return <DashboardPage onNavigate={setActiveTab} onViewTransaction={handleViewTransactionDetail} />;
    }
  };

  if (isAuthenticated) {
    return (
      <MainLayout 
        onLogout={handleLogout} 
        currentTab={activeTab === 'transaction-detail' ? 'history' : activeTab} 
        onChangeTab={setActiveTab}
      >
        {renderContent()}
      </MainLayout>
    );
  }

  return (
    <AuthPage onLoginSuccess={handleLoginSuccess} />
  );
}

export default App;