import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, ArrowRight, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const modules = [
    {
      title: 'AI漫剧',
      description: '视频剧本创作',
      icon: Video,
      path: '/video',
      gradient: 'from-blue-500 via-indigo-500 to-purple-500',
      shadowColor: 'shadow-blue-500/25',
    },
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI 驱动的创作平台</span>
        </div>
        <h1 className="text-4xl font-bold mb-3">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600">
            AI Agent 平台
          </span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          强大的AI工具集合，释放你的创造力
        </p>
      </div>

      {/* Modules Grid */}
      <div className="flex justify-center max-w-4xl w-full">
        {modules.map((module, index) => {
          const Icon = module.icon;
          return (
            <button
              key={module.path}
              onClick={() => navigate(module.path)}
              className="group relative text-left animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative p-5 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1">
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center shadow-lg ${module.shadowColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {module.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {module.description}
                </p>
                
                {/* Arrow */}
                <ArrowRight className="absolute bottom-5 right-5 w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
