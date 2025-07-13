import React from 'react';
import { BookOpen, Play, FileText, GraduationCap, ExternalLink } from 'lucide-react';

interface ContentRecommendation {
  type: 'video' | 'book' | 'article' | 'course';
  title: string;
  description: string;
  url?: string;
  reason: string;
}

interface ContentRecommendationsProps {
  speakerName: string;
  weaknesses: string[];
  recommendations: ContentRecommendation[];
  isLoading?: boolean;
}

const ContentRecommendations: React.FC<ContentRecommendationsProps> = ({
  speakerName,
  weaknesses,
  recommendations,
  isLoading = false
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-5 h-5" />;
      case 'book':
        return <BookOpen className="w-5 h-5" />;
      case 'article':
        return <FileText className="w-5 h-5" />;
      case 'course':
        return <GraduationCap className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'book':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'article':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'course':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
          Personalized Learning Recommendations
        </h3>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
        Personalized Learning Recommendations for {speakerName}
      </h3>

      {/* Weaknesses Section */}
      {weaknesses.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Areas for Improvement:</h4>
          <div className="space-y-2">
            {weaknesses.map((weakness, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">{weakness}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      <div>
        <h4 className="text-md font-medium text-gray-800 mb-3">Recommended Resources:</h4>
        <div className="space-y-4">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${getTypeColor(recommendation.type)}`}>
                  {getIcon(recommendation.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{recommendation.title}</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(recommendation.type)}`}>
                      {recommendation.type.charAt(0).toUpperCase() + recommendation.type.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>
                  <p className="text-sm text-blue-600 mb-3">
                    <span className="font-medium">Why this helps:</span> {recommendation.reason}
                  </p>
                  {recommendation.url && (
                    <a
                      href={recommendation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <span>View Resource</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentRecommendations; 