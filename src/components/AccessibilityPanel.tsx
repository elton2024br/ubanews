import React, { useRef, useState } from 'react';
import { useAccessibilityAudit } from '@/hooks/useAccessibilityAudit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Eye,
  Keyboard,
  Palette,
  FileText,
  Smartphone,
  ChevronDown,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface AccessibilityPanelProps {
  targetRef?: React.RefObject<HTMLElement>;
  className?: string;
  showScore?: boolean;
  autoAudit?: boolean;
}

const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  targetRef,
  className = '',
  showScore = true,
  autoAudit = true
}) => {
  const defaultRef = useRef<HTMLElement>(document.body);
  const containerRef = targetRef || defaultRef;
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const {
    issues,
    isAuditing,
    runAudit,
    getIssuesByType,
    getIssuesBySeverity,
    hasErrors,
    getAccessibilityScore,
    errorCount,
    warningCount,
    infoCount
  } = useAccessibilityAudit(containerRef, {
    checkContrast: true,
    checkForms: true,
    checkTouchTargets: true,
    checkAria: true,
    checkKeyboardNav: true,
    announceIssues: false
  });

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const scrollToElement = (element?: HTMLElement) => {
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.outline = '3px solid #ef4444';
      element.style.outlineOffset = '2px';
      
      setTimeout(() => {
        element.style.outline = '';
        element.style.outlineOffset = '';
      }, 3000);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contrast':
        return <Palette className="h-4 w-4" />;
      case 'form':
        return <FileText className="h-4 w-4" />;
      case 'touch-target':
        return <Smartphone className="h-4 w-4" />;
      case 'aria':
        return <Eye className="h-4 w-4" />;
      case 'keyboard':
        return <Keyboard className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const issueTypes = [
    { key: 'contrast', label: 'Contraste', issues: getIssuesByType('contrast') },
    { key: 'form', label: 'Formulários', issues: getIssuesByType('form') },
    { key: 'touch-target', label: 'Área de Toque', issues: getIssuesByType('touch-target') },
    { key: 'aria', label: 'ARIA', issues: getIssuesByType('aria') },
    { key: 'keyboard', label: 'Navegação por Teclado', issues: getIssuesByType('keyboard') }
  ];

  const accessibilityScore = getAccessibilityScore();

  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Auditoria de Acessibilidade
          </CardTitle>
          <div className="flex items-center gap-2">
            {showScore && (
              <Badge 
                variant={getScoreBadgeVariant(accessibilityScore)}
                className="text-sm font-medium"
              >
                {accessibilityScore}%
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={runAudit}
              disabled={isAuditing}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isAuditing ? 'animate-spin' : ''}`} />
              {isAuditing ? 'Auditando...' : 'Auditar'}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>{errorCount} erros</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span>{warningCount} avisos</span>
          </div>
          <div className="flex items-center gap-1">
            <Info className="h-4 w-4 text-blue-500" />
            <span>{infoCount} informações</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {issues.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-lg font-medium text-green-700">Excelente!</p>
              <p className="text-sm text-muted-foreground">
                Nenhum problema de acessibilidade encontrado.
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {issueTypes.map((type) => {
                if (type.issues.length === 0) return null;
                
                const isExpanded = expandedSections.has(type.key);
                
                return (
                  <Collapsible key={type.key} open={isExpanded}>
                    <CollapsibleTrigger
                      onClick={() => toggleSection(type.key)}
                      className="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {getTypeIcon(type.key)}
                        <span className="font-medium">{type.label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {type.issues.length}
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-2">
                      <div className="space-y-2 pl-4">
                        {type.issues.map((issue, index) => (
                          <div
                            key={`${type.key}-${index}`}
                            className="rounded-md border-l-4 border-l-muted bg-muted/30 p-3"
                            style={{
                              borderLeftColor: issue.severity === 'error' ? '#ef4444' : 
                                             issue.severity === 'warning' ? '#f59e0b' : '#3b82f6'
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {getSeverityIcon(issue.severity)}
                                  <span className="text-sm font-medium">
                                    {issue.message}
                                  </span>
                                </div>
                                {issue.suggestion && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    💡 {issue.suggestion}
                                  </p>
                                )}
                              </div>
                              {issue.element && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => scrollToElement(issue.element)}
                                  className="shrink-0"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        )}
        
        {showScore && issues.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Pontuação de Acessibilidade
              </p>
              <div className={`text-2xl font-bold ${getScoreColor(accessibilityScore)}`}>
                {accessibilityScore}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {accessibilityScore >= 90 ? 'Excelente acessibilidade!' :
                 accessibilityScore >= 70 ? 'Boa acessibilidade, mas pode melhorar.' :
                 'Acessibilidade precisa de atenção.'}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessibilityPanel;