import React from 'react';

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  children?: React.ReactNode;
  defaultValue?: string;
  className?: string;
}

export const Tab: React.FC<TabProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? 'bg-primary text-white'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
};

export const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  children,
  defaultValue,
  className 
}) => {
  return (
    <div className={`flex flex-col ${className || ''}`}>
      <div className="flex space-x-2 border-b border-gray-200 pb-4">
        {tabs.map((tab) => (
          <Tab
            key={tab}
            label={tab}
            isActive={activeTab === tab}
            onClick={() => onTabChange(tab)}
          />
        ))}
      </div>
      {children}
    </div>
  );
};

export const TabsList: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex space-x-2">{children}</div>;
};

export const TabsTrigger: React.FC<{ 
  value: string;
  children: React.ReactNode;
  onClick: () => void;
}> = ({ value, children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-sm font-medium rounded-md transition-colors"
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{ 
  value: string;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return <div className="mt-4">{children}</div>;
}; 