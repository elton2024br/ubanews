import { EmailTemplateVariables } from '@/types/newsletter';

// Base template structure
const baseTemplate = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content {
            padding: 30px 20px;
        }
        .news-item {
            border-bottom: 1px solid #eee;
            padding: 20px 0;
            margin-bottom: 20px;
        }
        .news-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        .news-item h3 {
            color: #667eea;
            margin: 0 0 10px 0;
            font-size: 18px;
        }
        .news-item p {
            margin: 0 0 10px 0;
            color: #666;
        }
        .news-item .meta {
            font-size: 12px;
            color: #999;
        }
        .news-item .read-more {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            margin: 10px 0;
        }
        .highlight {
            background-color: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #667eea;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{subject}}</h1>
        </div>
        <div class="content">
            {{content}}
        </div>
        <div class="footer">
            <p>
                Você está recebendo este email porque se inscreveu na nossa newsletter.<br>
                <a href="{{unsubscribe_url}}">Cancelar inscrição</a> | 
                <a href="{{site_url}}">Visitar nosso site</a>
            </p>
            <p>{{site_name}} - {{site_description}}</p>
        </div>
    </div>
</body>
</html>
`;

// Daily news template
export const dailyNewsTemplate = `
<div class="news-item">
    <h3>{{news_title_1}}</h3>
    <p>{{news_summary_1}}</p>
    <div class="meta">{{news_date_1}} - {{news_category_1}}</div>
    <a href="{{news_url_1}}" class="read-more">Ler mais →</a>
</div>

<div class="news-item">
    <h3>{{news_title_2}}</h3>
    <p>{{news_summary_2}}</p>
    <div class="meta">{{news_date_2}} - {{news_category_2}}</div>
    <a href="{{news_url_2}}" class="read-more">Ler mais →</a>
</div>

<div class="news-item">
    <h3>{{news_title_3}}</h3>
    <p>{{news_summary_3}}</p>
    <div class="meta">{{news_date_3}} - {{news_category_3}}</div>
    <a href="{{news_url_3}}" class="read-more">Ler mais →</a>
</div>

<div class="highlight">
    <strong>Destaque do Dia:</strong> {{featured_news_title}}
    <br>
    <a href="{{featured_news_url}}" class="btn">Ver notícia completa</a>
</div>
`;

// Breaking news template
export const breakingNewsTemplate = `
<div class="highlight">
    <h2 style="color: #e53e3e; margin: 0 0 15px 0;">🚨 NOTÍCIA URGENTE</h2>
    <h3>{{breaking_news_title}}</h3>
    <p>{{breaking_news_summary}}</p>
    <div class="meta">{{breaking_news_time}} - Atualizado há {{time_ago}}</div>
    <a href="{{breaking_news_url}}" class="btn">Ver notícia completa</a>
</div>

{{#if related_news}}
<div class="news-item">
    <h3>Notícias relacionadas</h3>
    {{related_news}}
</div>
{{/if}}
`;

// Weekly digest template
export const weeklyDigestTemplate = `
<div class="news-item">
    <h3>📊 Resumo da Semana</h3>
    <p>{{weekly_summary}}</p>
</div>

<div class="news-item">
    <h3>🏆 Top 5 Notícias</h3>
    <ol>
        <li><a href="{{top_news_url_1}}">{{top_news_title_1}}</a></li>
        <li><a href="{{top_news_url_2}}">{{top_news_title_2}}</a></li>
        <li><a href="{{top_news_url_3}}">{{top_news_title_3}}</a></li>
        <li><a href="{{top_news_url_4}}">{{top_news_title_4}}</a></li>
        <li><a href="{{top_news_url_5}}">{{top_news_title_5}}</a></li>
    </ol>
</div>

<div class="news-item">
    <h3>📈 Estatísticas da Semana</h3>
    <ul>
        <li>Total de notícias publicadas: {{total_news_published}}</li>
        <li>Notícias mais lidas: {{most_read_news}}</li>
        <li>Categoria mais popular: {{most_popular_category}}</li>
    </ul>
</div>

<div class="highlight">
    <strong>Próxima Semana:</strong> {{next_week_preview}}
</div>
`;

// Welcome template for new subscribers
export const welcomeTemplate = `
<div class="highlight">
    <h2 style="color: #667eea; margin: 0 0 15px 0;">🎉 Bem-vindo(a) à nossa Newsletter!</h2>
    <p>Olá {{name}},</p>
    <p>Obrigado por se inscrever na nossa newsletter! A partir de agora, você receberá as últimas notícias e atualizações diretamente no seu email.</p>
</div>

<div class="news-item">
    <h3>O que você pode esperar:</h3>
    <ul>
        <li>📰 Notícias diárias sobre Ubatuba e região</li>
        <li>🌊 Informações sobre eventos e atrações locais</li>
        <li>📊 Resumos semanais dos destaques</li>
        <li>🚨 Alertas de notícias urgentes</li>
    </ul>
</div>

<div class="news-item">
    <h3>Personalize sua experiência</h3>
    <p>Você pode personalizar suas preferências a qualquer momento visitando nosso site ou clicando no link de preferências abaixo.</p>
    <a href="{{preferences_url}}" class="btn">Personalizar preferências</a>
</div>

<div class="highlight">
    <p><strong>Dica:</strong> Adicione nosso email aos seus contatos para garantir que nossas mensagens não vão para a caixa de spam!</p>
</div>
`;

// Custom template for special occasions
export const customTemplate = `
<div class="highlight">
    <h2>{{custom_title}}</h2>
    <p>{{custom_message}}</p>
</div>

<div class="news-item">
    {{custom_content}}
</div>

{{#if cta_button}}
<div style="text-align: center; margin: 30px 0;">
    <a href="{{cta_url}}" class="btn">{{cta_text}}</a>
</div>
{{/if}}
`;

// Template renderer function
export const renderTemplate = (templateName: string, variables: EmailTemplateVariables): string => {
  let templateContent = '';
  
  switch (templateName) {
    case 'daily':
      templateContent = dailyNewsTemplate;
      break;
    case 'breaking':
      templateContent = breakingNewsTemplate;
      break;
    case 'weekly':
      templateContent = weeklyDigestTemplate;
      break;
    case 'welcome':
      templateContent = welcomeTemplate;
      break;
    case 'custom':
      templateContent = customTemplate;
      break;
    default:
      templateContent = dailyNewsTemplate;
  }

  // Combine base template with specific content
  let finalTemplate = baseTemplate.replace('{{content}}', templateContent);

  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    finalTemplate = finalTemplate.replace(new RegExp(placeholder, 'g'), value || '');
  });

  // Handle conditional blocks
  finalTemplate = finalTemplate.replace(/\{\{#if\s+(.+?)\}\}\s*([\s\S]*?)\s*\{\{\/if\}\}/g, (match, condition, content) => {
    const conditionValue = variables[condition as keyof EmailTemplateVariables];
    return conditionValue ? content : '';
  });

  return finalTemplate;
};

// Predefined templates configuration
export const newsletterTemplates = [
  {
    id: 'daily',
    name: 'Notícias Diárias',
    description: 'Template para envio diário de notícias',
    variables: [
      'news_title_1', 'news_summary_1', 'news_date_1', 'news_category_1', 'news_url_1',
      'news_title_2', 'news_summary_2', 'news_date_2', 'news_category_2', 'news_url_2',
      'news_title_3', 'news_summary_3', 'news_date_3', 'news_category_3', 'news_url_3',
      'featured_news_title', 'featured_news_url'
    ]
  },
  {
    id: 'breaking',
    name: 'Notícias Urgentes',
    description: 'Template para notícias de última hora',
    variables: [
      'breaking_news_title', 'breaking_news_summary', 'breaking_news_time', 'breaking_news_url',
      'time_ago', 'related_news'
    ]
  },
  {
    id: 'weekly',
    name: 'Resumo Semanal',
    description: 'Template para resumo semanal das notícias',
    variables: [
      'weekly_summary', 'total_news_published', 'most_read_news', 'most_popular_category',
      'top_news_title_1', 'top_news_url_1', 'top_news_title_2', 'top_news_url_2',
      'top_news_title_3', 'top_news_url_3', 'top_news_title_4', 'top_news_url_4',
      'top_news_title_5', 'top_news_url_5', 'next_week_preview'
    ]
  },
  {
    id: 'welcome',
    name: 'Boas-vindas',
    description: 'Template de boas-vindas para novos inscritos',
    variables: [
      'name', 'preferences_url'
    ]
  },
  {
    id: 'custom',
    name: 'Personalizado',
    description: 'Template personalizado para ocasiões especiais',
    variables: [
      'custom_title', 'custom_message', 'custom_content', 'cta_button', 'cta_url', 'cta_text'
    ]
  }
];