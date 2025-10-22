import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Calendar, Clock, User, ArrowLeft, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

interface BlogArticle {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorCredentials: string;
  date: string;
  readTime: number;
  category: string;
  tags: string[];
  featuredImage: string;
  metaDescription: string;
  metaKeywords: string[];
  views: number;
  likes: number;
}

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();

  // Fetch article
  const { data: articleData, isLoading } = useQuery<{ article: BlogArticle }>({
    queryKey: [`/api/blog/articles/${slug}`],
    enabled: !!slug
  });

  // Fetch related articles
  const { data: relatedData } = useQuery<{ articles: BlogArticle[] }>({
    queryKey: [`/api/blog/articles/${slug}/related`],
    enabled: !!slug
  });

  const article = articleData?.article;
  const relatedArticles = relatedData?.articles || [];

  // Set page title and meta tags
  useEffect(() => {
    if (article) {
      document.title = `${article.title} | KareMatch Blog`;

      // Create or update meta tags
      const setMetaTag = (property: string, content: string) => {
        let element = document.querySelector(`meta[property="${property}"]`) ||
          document.querySelector(`meta[name="${property}"]`);

        if (!element) {
          element = document.createElement('meta');
          if (property.startsWith('og:') || property.startsWith('article:')) {
            element.setAttribute('property', property);
          } else {
            element.setAttribute('name', property);
          }
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };

      // Standard meta tags
      setMetaTag('description', article.metaDescription);
      setMetaTag('keywords', article.metaKeywords.join(', '));

      // Open Graph tags
      setMetaTag('og:title', article.title);
      setMetaTag('og:description', article.metaDescription);
      setMetaTag('og:type', 'article');
      setMetaTag('og:url', window.location.href);
      setMetaTag('og:image', article.featuredImage);
      setMetaTag('og:site_name', 'KareMatch');

      // Article specific tags
      setMetaTag('article:published_time', article.date);
      setMetaTag('article:author', article.author);
      setMetaTag('article:section', article.category);
      setMetaTag('article:tag', article.tags.join(', '));

      // Twitter Card tags
      setMetaTag('twitter:card', 'summary_large_image');
      setMetaTag('twitter:title', article.title);
      setMetaTag('twitter:description', article.metaDescription);
      setMetaTag('twitter:image', article.featuredImage);

      // JSON-LD structured data for SEO
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title,
        "description": article.metaDescription,
        "image": article.featuredImage,
        "datePublished": article.date,
        "author": {
          "@type": "Person",
          "name": article.author,
          "jobTitle": article.authorCredentials
        },
        "publisher": {
          "@type": "Organization",
          "name": "KareMatch",
          "logo": {
            "@type": "ImageObject",
            "url": "https://karematch.com/logo.png"
          }
        },
        "articleSection": article.category,
        "keywords": article.tags.join(', ')
      };

      let scriptTag = document.querySelector('script[type="application/ld+json"]');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(jsonLd);
    }

    return () => {
      // Reset title on unmount
      document.title = 'KareMatch';
    };
  }, [article]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container mx-auto px-4 max-w-4xl py-8">
        <Button variant="ghost" asChild>
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>
      </div>

      {/* Article Header */}
      <article className="container mx-auto px-4 max-w-4xl pb-12">
        {/* Category Badge */}
        <Badge className="mb-4">{article.category}</Badge>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          {article.title}
        </h1>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{article.author}, {article.authorCredentials}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {new Date(article.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {article.readTime} min read
          </div>
        </div>

        {/* Featured Image */}
        {article.featuredImage && (
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full h-64 md:h-96 object-cover rounded-lg mb-8"
          />
        )}

        {/* Article Content */}
        <div className="prose prose-lg max-w-none mb-12">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => (
                <h2 className="text-3xl font-bold mt-12 mb-4">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-2xl font-bold mt-8 mb-3">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed text-foreground/90">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
              ),
              strong: ({ children }) => (
                <strong className="font-bold">{children}</strong>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8 pt-8 border-t">
          {article.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Engagement Actions */}
        <div className="flex items-center gap-4 mb-12 pt-4 border-t">
          <Button variant="outline" size="sm" className="gap-2">
            <Heart className="h-4 w-4" />
            Like ({article.likes})
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Author Card */}
        <Card className="mb-12">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">
                  {article.author}, {article.authorCredentials}
                </h3>
                <p className="text-muted-foreground text-sm">
                  Licensed mental health professional specializing in evidence-based treatments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <Link key={relatedArticle.slug} href={`/blog/${relatedArticle.slug}`}>
                  <Card className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer h-full">
                    <img
                      src={relatedArticle.featuredImage}
                      alt={relatedArticle.title}
                      className="w-full h-32 object-cover"
                    />
                    <CardContent className="p-4">
                      <Badge className="mb-2 text-xs">{relatedArticle.category}</Badge>
                      <h3 className="font-bold mb-2 line-clamp-2">
                        {relatedArticle.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {relatedArticle.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Need Professional Support?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Connect with licensed therapists who can provide personalized care for your mental health needs.
          </p>
          <Button size="lg" asChild>
            <Link href="/therapists">Find a Therapist</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
