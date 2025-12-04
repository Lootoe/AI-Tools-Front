import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Workflow, ImagePlus, Video } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const modules = [
    {
      title: 'AI对话',
      description: '与AI助手进行智能对话',
      icon: MessageSquare,
      path: '/chat',
      gradient: 'from-blue-500 to-purple-600',
    },
    {
      title: '工作流',
      description: '创建和管理自动化工作流',
      icon: Workflow,
      path: '/workflow',
      gradient: 'from-green-500 to-teal-600',
    },
    {
      title: '文生图',
      description: '文本生成精美图片',
      icon: ImagePlus,
      path: '/text-to-image',
      gradient: 'from-orange-500 to-pink-600',
    },
    {
      title: '图生视频',
      description: '图片生成动态视频',
      icon: Video,
      path: '/image-to-video',
      gradient: 'from-purple-500 to-indigo-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            AI Agent 平台
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            强大的AI工具集合，助力您的创造力
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.path}
                onClick={() => navigate(module.path)}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                
                {/* Icon Container */}
                <div className={`relative mb-6 w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {module.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {module.description}
                  </p>
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg 
                    className="w-6 h-6 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5l7 7-7 7" 
                    />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-500 dark:text-gray-400">
            选择一个模块开始您的AI之旅
          </p>
        </div>
      </div>
    </div>
  );
};
