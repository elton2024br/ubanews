import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Eye,
  Save,
  Upload,
  Image as ImageIcon,
  FileText,
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuditLog } from '../hooks/useAuditLog';
import { useImageUpload, type UploadedImage } from '../hooks/useImageUpload';

interface AdvancedEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  onSave?: (content: string) => Promise<void>;
  className?: string;
}

// UploadedImage interface is now imported from useImageUpload hook

const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  value,
  onChange,
  placeholder = 'Comece a escrever sua notícia...',
  height = 500,
  disabled = false,
  autoSave = true,
  autoSaveInterval = 30000, // 30 seconds
  onSave,
  className = '',
}) => {
  const editorRef = useRef<{ getWin: () => Window; insertContent: (content: string) => void; getContent: () => string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [previewMode, setPreviewMode] = useState<'tabs' | 'split'>('tabs');
  const [activeTab, setActiveTab] = useState('editor');
  const { uploadImage, getImages, deleteImage, isUploading, uploadProgress } = useImageUpload();
  const [previewContent, setPreviewContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const { logAction } = useAuditLog();

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !onSave || !isDirty) return;

    const autoSaveTimer = setInterval(async () => {
      if (isDirty && value.trim()) {
        try {
          await onSave(value);
          setLastSaved(new Date());
          setIsDirty(false);
          toast.success('Conteúdo salvo automaticamente');
        } catch (error) {
          console.error('Erro no auto-save:', error);
          toast.error('Erro ao salvar automaticamente');
        }
      }
    }, autoSaveInterval);

    return () => clearInterval(autoSaveTimer);
  }, [autoSave, onSave, isDirty, value, autoSaveInterval]);

  // Update preview content when editor content changes
  useEffect(() => {
    setPreviewContent(value);
  }, [value]);

  const handleEditorChange = useCallback((content: string) => {
    onChange(content);
    // Update preview content in real-time
    setPreviewContent(content);
    setIsDirty(true);
    
    // Update word and character count
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    setWordCount(textContent.split(/\s+/).filter(word => word.length > 0).length);
    setCharCount(textContent.length);
  }, [onChange]);

  // Initialize preview content
  useEffect(() => {
    if (value && !previewContent) {
      setPreviewContent(value);
    }
  }, [value, previewContent]);

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const result = await uploadImage(file);
    
    if (result.success && result.image && result.url) {
      // Add to local state for gallery
      setUploadedImages(prev => [...prev, result.image!]);
      return result.url;
    } else {
      throw new Error(result.error || 'Erro no upload da imagem');
    }
  }, [uploadImage]);

  const handleManualSave = useCallback(async () => {
    if (!onSave) return;
    
    try {
      await onSave(value);
      setLastSaved(new Date());
      setIsDirty(false);
      toast.success('Conteúdo salvo com sucesso!');
      
      await logAction({
        action: 'editor.manual_save',
        resource_type: 'content',
        metadata: {
          wordCount,
          charCount,
          contentLength: value.length
        }
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar conteúdo');
    }
  }, [onSave, value, logAction, wordCount, charCount]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    
    // Trigger editor resize after fullscreen toggle
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.getWin().dispatchEvent(new Event('resize'));
      }
    }, 100);
  }, []);

  const insertImageFromGallery = useCallback((image: UploadedImage) => {
    if (editorRef.current) {
      // Get public URL from Supabase
      const publicUrl = image.public_url || `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/images/${image.file_path}`;
      const altText = image.alt_text || image.original_name || 'Imagem';
      editorRef.current.insertContent(
        `<img src="${publicUrl}" alt="${altText}" style="max-width: 100%; height: auto;" />`
      );
    }
  }, []);

  const handleDeleteImage = useCallback(async (imageId: string) => {
    const success = await deleteImage(imageId);
    if (success) {
      setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    }
  }, [deleteImage]);

  // Load images on component mount
  useEffect(() => {
    const loadImages = async () => {
      const images = await getImages();
      setUploadedImages(images);
    };
    loadImages();
  }, [getImages]);

  const editorConfig = {
    height,
    menubar: true,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
      'template', 'codesample', 'hr', 'pagebreak', 'nonbreaking', 'toc'
    ],
    toolbar: [
      'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough',
      'forecolor backcolor | align lineheight | numlist bullist indent outdent',
      'emoticons charmap | insertfile image media link | codesample',
      'ltr rtl | preview code fullscreen | help'
    ].join(' | '),
    content_style: `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      blockquote {
        border-left: 4px solid #e2e8f0;
        margin: 1.5em 0;
        padding: 0.5em 1em;
        background: #f8fafc;
        font-style: italic;
      }
      pre {
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 1em;
        overflow-x: auto;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
      }
      table td, table th {
        border: 1px solid #e2e8f0;
        padding: 8px 12px;
        text-align: left;
      }
      table th {
        background: #f8fafc;
        font-weight: 600;
      }
    `,
    images_upload_handler: async (blobInfo: { blob: () => File }) => {
      const file = blobInfo.blob();
      return await handleImageUpload(file);
    },
    automatic_uploads: true,
    file_picker_types: 'image',
    file_picker_callback: (callback: (url: string, meta?: { alt: string }) => void, value: string, meta: { filetype: string }) => {
      if (meta.filetype === 'image') {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.onchange = async function(this: HTMLInputElement) {
          const file = this.files?.[0];
          if (file) {
            try {
              const url = await handleImageUpload(file);
              callback(url, { alt: file.name });
            } catch (error) {
              console.error('Erro no upload:', error);
            }
          }
        };
        input.click();
      }
    },
    setup: (editor: { on: (event: string, callback: () => void) => void; getContent: () => string }) => {
      editor.on('change', () => {
        const content = editor.getContent();
        handleEditorChange(content);
      });
    },
    language: 'pt_BR',
    directionality: 'ltr',
    browser_spellcheck: true,
    contextmenu: 'link image table',
    quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
    quickbars_insert_toolbar: 'quickimage quicktable',
    toolbar_mode: 'sliding',
    resize: true,
    statusbar: true,
    elementpath: false,
    branding: false,
  };

  const containerClass = `
    ${className}
    ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'}
    transition-all duration-300
  `;

  return (
    <div className={containerClass}>
      <Card className={isFullscreen ? 'h-full' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Editor Avançado
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <Badge variant="outline">
                  {wordCount} palavras
                </Badge>
                <Badge variant="outline">
                  {charCount} caracteres
                </Badge>
                {lastSaved && (
                  <Badge variant="outline" className="text-green-600">
                    Salvo {lastSaved.toLocaleTimeString()}
                  </Badge>
                )}
                {isDirty && (
                  <Badge variant="outline" className="text-orange-600">
                    Não salvo
                  </Badge>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-1">
                {/* Image Gallery */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Galeria de Imagens</DialogTitle>
                      <DialogDescription>
                        Clique em uma imagem para inseri-la no editor
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                      {uploadedImages.map((image) => {
                        // Get public URL from Supabase
                        const publicUrl = image.public_url || `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/images/${image.file_path}`;
                        return (
                          <div
                            key={image.id}
                            className="relative group cursor-pointer border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            onClick={() => insertImageFromGallery(image)}
                          >
                            <img
                              src={publicUrl}
                              alt={image.alt_text || image.original_name || 'Imagem'}
                              className="w-full h-24 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                              <Upload className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              <Button
                                size="sm"
                                variant="destructive"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteImage(image.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="p-2">
                              <p className="text-xs font-medium truncate">{image.original_name}</p>
                              <p className="text-xs text-gray-500">
                                {(image.file_size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      
                      {uploadedImages.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma imagem enviada ainda</p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* Preview Mode Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(prev => prev === 'tabs' ? 'split' : 'tabs')}
                >
                  <Eye className="h-4 w-4" />
                  {previewMode === 'tabs' ? 'Dividir' : 'Abas'}
                </Button>
                
                {/* Preview Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Preview do Conteúdo</DialogTitle>
                    </DialogHeader>
                    
                    <div className="prose prose-lg max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewContent) }} />
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* Save */}
                {onSave && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualSave}
                    disabled={!isDirty}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Fullscreen */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className={isFullscreen ? 'flex-1 pb-4' : 'pb-4'}>
          {previewMode === 'tabs' ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Editor</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Preview</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="editor" className="mt-4">
                <div className={isFullscreen ? 'h-[calc(100vh-200px)]' : ''}>
                  <Editor
                    onInit={(evt, editor) => editorRef.current = editor}
                    value={value}
                    init={{
                      ...editorConfig,
                      height: isFullscreen ? '100%' : height,
                    }}
                    disabled={disabled}
                  />
                </div>
                
                {isUploading && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Enviando imagem... {uploadProgress}%</span>
                    <div className="w-full bg-gray-200 rounded-full h-2 ml-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="preview" className="mt-4">
                <div className={`prose prose-lg max-w-none border rounded-lg p-6 bg-gray-50 ${
                  isFullscreen ? 'h-[calc(100vh-200px)] overflow-y-auto' : 'min-h-[400px]'
                }`}>
                  {previewContent ? (
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewContent) }} />
                  ) : (
                    <div className="text-center text-gray-500 py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum conteúdo para visualizar</p>
                      <p className="text-sm">Comece a escrever no editor</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            /* Split Mode - Editor and Preview Side by Side */
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Editor Column */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Editor</span>
                </div>
                <div className={`flex-1 ${isFullscreen ? 'h-[calc(100vh-250px)]' : ''}`}>
                  <Editor
                    onInit={(evt, editor) => editorRef.current = editor}
                    value={value}
                    init={{
                      ...editorConfig,
                      height: isFullscreen ? '100%' : height,
                    }}
                    disabled={disabled}
                  />
                </div>
                
                {isUploading && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Enviando imagem... {uploadProgress}%</span>
                    <div className="w-full bg-gray-200 rounded-full h-2 ml-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Preview Column */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">Preview em Tempo Real</span>
                  <Badge variant="outline" className="text-xs">
                    Atualização automática
                  </Badge>
                </div>
                <div className={`flex-1 prose prose-lg max-w-none border rounded-lg p-6 bg-gray-50 overflow-y-auto ${
                  isFullscreen ? 'h-[calc(100vh-250px)]' : 'min-h-[400px]'
                }`}>
                  {previewContent ? (
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewContent) }} />
                  ) : (
                    <div className="text-center text-gray-500 py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum conteúdo para visualizar</p>
                      <p className="text-sm">Comece a escrever no editor</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedEditor;