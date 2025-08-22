import React from 'react';
import DOMPurify from 'dompurify';
import { ArrowLeft, Clock, Calendar, Tag, Share2 } from 'lucide-react';
import { NewsArticle } from '@/shared/types/news';
import { formatDate } from '../utils/dateUtils';
import { OptimizedImage } from './OptimizedImage';

interface NewsDetailProps {
  article: NewsArticle;
  onBack: () => void;
}

export const NewsDetail: React.FC<NewsDetailProps> = ({ article, onBack }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback para navegadores que não suportam Web Share API
      navigator.clipboard.writeText(window.location.href);
      // Aqui você poderia mostrar um toast de confirmação
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header com botão voltar */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-blue-100">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Voltar</span>
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-all"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* Imagem principal */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <OptimizedImage
          src={article.image.src}
          alt={article.image.alt}
          className="w-full h-full object-cover"
          width={800}
          height={400}
          priority={true}
          sizes="(max-width: 768px) 100vw, 800px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Categoria badge */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
            {article.category}
          </span>
        </div>
      </div>

      {/* Conteúdo do artigo */}
      <div className="px-4 py-6 max-w-4xl mx-auto">
        {/* Título */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Metadados */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <span>{formatDate(article.date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>{article.readTime} min de leitura</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {article.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium"
            >
              <Tag size={12} />
              {tag}
            </span>
          ))}
        </div>

        {/* Legenda da imagem */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-gray-700 italic">
            {article.image.caption}
          </p>
        </div>

        {/* Conteúdo principal */}
        <div className="prose prose-lg max-w-none">
          <div
            className="text-gray-800 leading-relaxed whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
          />
        </div>

        {/* Botão de compartilhamento no final */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Gostou desta notícia? Compartilhe com seus amigos!
            </p>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 size={16} />
              Compartilhar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;