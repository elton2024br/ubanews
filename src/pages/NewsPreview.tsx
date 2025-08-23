import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, User, Tag, AlertTriangle } from 'lucide-react';
import { AdminNews } from '@/admin/types/admin'; // Reusing the type, might need adjustment

const NewsPreview = () => {
  const [previewData, setPreviewData] = useState<AdminNews | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const dataString = sessionStorage.getItem('news_preview_data');
    if (dataString) {
      try {
        const data = JSON.parse(dataString);
        // A minimal validation to ensure we have something to render
        if (data.title && data.content) {
          setPreviewData(data);
        }
      } catch (error) {
        console.error("Failed to parse preview data from sessionStorage", error);
      }
    }

    // Optional: Clean up sessionStorage on component unmount
    return () => {
      sessionStorage.removeItem('news_preview_data');
    };
  }, []);

  if (!previewData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Nenhum dado para pré-visualização</h1>
        <p className="text-muted-foreground mb-4">
          Acesse o formulário de notícias e clique em "Pré-visualizar" para ver a matéria aqui.
        </p>
        <Button onClick={() => navigate('/admin/news')}>Voltar para Notícias</Button>
      </div>
    );
  }

  // This layout should mimic the public NewsDetail page as closely as possible
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-4">
        <Button variant="outline" onClick={() => window.close()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Fechar Pré-visualização
        </Button>
      </div>
      <Card>
        <CardContent className="p-4 md:p-8">
          {previewData.featured_image_url && (
            <img
              src={previewData.featured_image_url}
              alt={previewData.title}
              className="w-full h-auto max-h-[500px] object-cover rounded-lg mb-6"
            />
          )}

          <div className="space-y-4">
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{previewData.author_name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(previewData.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Tag className="h-4 w-4" />
                <span>{previewData.category}</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{previewData.title}</h1>

            {previewData.summary && (
              <p className="text-lg text-gray-600 dark:text-gray-300 italic border-l-4 border-primary pl-4">
                {previewData.summary}
              </p>
            )}

            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: previewData.content }}
            />

            {previewData.tags && previewData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {previewData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsPreview;
