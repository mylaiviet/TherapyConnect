import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface ArticleFrontmatter {
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  authorCredentials: string;
  date: string;
  readTime: number;
  category: string;
  tags: string[];
  featuredImage: string;
  metaDescription: string;
  metaKeywords: string[];
}

export interface ParsedArticle {
  frontmatter: ArticleFrontmatter;
  content: string;
  slug: string;
}

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog');

/**
 * Get all markdown files from the content/blog directory
 */
export function getAllArticleSlugs(): string[] {
  try {
    if (!fs.existsSync(CONTENT_DIR)) {
      console.warn('Content directory does not exist:', CONTENT_DIR);
      return [];
    }

    const files = fs.readdirSync(CONTENT_DIR);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace(/\.md$/, ''));
  } catch (error) {
    console.error('Error reading content directory:', error);
    return [];
  }
}

/**
 * Parse a markdown file and extract frontmatter and content
 */
export function parseMarkdownFile(slug: string): ParsedArticle | null {
  try {
    const filePath = path.join(CONTENT_DIR, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return null;
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      frontmatter: data as ArticleFrontmatter,
      content,
      slug
    };
  } catch (error) {
    console.error(`Error parsing markdown file ${slug}:`, error);
    return null;
  }
}

/**
 * Get all articles with their metadata
 */
export function getAllArticles(): ParsedArticle[] {
  const slugs = getAllArticleSlugs();
  const articles = slugs
    .map(slug => parseMarkdownFile(slug))
    .filter((article): article is ParsedArticle => article !== null)
    .sort((a, b) => {
      // Sort by date, newest first
      return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
    });

  return articles;
}

/**
 * Get articles by category
 */
export function getArticlesByCategory(category: string): ParsedArticle[] {
  const allArticles = getAllArticles();
  return allArticles.filter(
    article => article.frontmatter.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get articles by tag
 */
export function getArticlesByTag(tag: string): ParsedArticle[] {
  const allArticles = getAllArticles();
  return allArticles.filter(article =>
    article.frontmatter.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

/**
 * Get related articles based on tags and category
 */
export function getRelatedArticles(slug: string, limit: number = 3): ParsedArticle[] {
  const currentArticle = parseMarkdownFile(slug);
  if (!currentArticle) return [];

  const allArticles = getAllArticles().filter(article => article.slug !== slug);

  // Score articles based on similarity
  const scoredArticles = allArticles.map(article => {
    let score = 0;

    // Same category: +3 points
    if (article.frontmatter.category === currentArticle.frontmatter.category) {
      score += 3;
    }

    // Shared tags: +1 point per tag
    const sharedTags = article.frontmatter.tags.filter(tag =>
      currentArticle.frontmatter.tags.includes(tag)
    );
    score += sharedTags.length;

    return { article, score };
  });

  // Sort by score and return top N
  return scoredArticles
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.article);
}

/**
 * Search articles by keyword in title, excerpt, or content
 */
export function searchArticles(query: string): ParsedArticle[] {
  const allArticles = getAllArticles();
  const lowercaseQuery = query.toLowerCase();

  return allArticles.filter(article => {
    const searchableText = `
      ${article.frontmatter.title}
      ${article.frontmatter.excerpt}
      ${article.content}
      ${article.frontmatter.tags.join(' ')}
    `.toLowerCase();

    return searchableText.includes(lowercaseQuery);
  });
}
