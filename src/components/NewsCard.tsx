import { Badge } from "@/components/ui/badge";
import { Clock, Eye } from "lucide-react";

interface NewsCardProps {
  title: string;
  summary: string;
  date: string;
  category: string;
  readTime: string;
  views: string;
  image?: string;
}

const NewsCard = ({ title, summary, date, category, readTime, views, image }: NewsCardProps) => {
  return (
    <article className="bg-news-card hover:bg-news-card-hover border border-border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg group cursor-pointer">
      {/* Image placeholder */}
      <div className="w-full h-48 bg-secondary flex items-center justify-center text-muted-foreground">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-2">📰</div>
            <span className="text-sm">Imagem da notícia</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="category" className="text-xs">
            {category}
          </Badge>
        </div>
        
        <h3 className="font-semibold text-lg mb-2 group-hover:text-accent transition-colors line-clamp-2">
          {title}
        </h3>
        
        <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
          {summary}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{date}</span>
            </span>
            <span>{readTime}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Eye className="w-3 h-3" />
            <span>{views}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;