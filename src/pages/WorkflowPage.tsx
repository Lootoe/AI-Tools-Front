import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Workflow } from 'lucide-react';

export const WorkflowPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="mr-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            工作流
          </h1>
        </div>

        {/* Placeholder Content */}
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Workflow className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            工作流模块
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            该模块正在开发中，敬请期待...
          </p>
        </div>
      </div>
    </div>
  );
};
