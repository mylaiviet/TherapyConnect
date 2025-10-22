import { Router } from 'express';
import { db } from '../db';
import {
  blogArticles,
  blogComments,
  blogCategories,
  blogAuthors,
  blogNewsletterSubscribers,
  blogArticleLikes
} from '@shared/schema';
import { eq, desc, and, sql, or } from 'drizzle-orm';
import {
  getAllArticles,
  parseMarkdownFile,
  getRelatedArticles,
  searchArticles
} from '../utils/markdownParser';

const router = Router();

// ============================================
// PUBLIC ROUTES - Blog Articles
// ============================================

/**
 * GET /api/blog/articles
 * Get all published articles with pagination
 */
router.get('/articles', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const tag = req.query.tag as string;
    const search = req.query.search as string;

    // Get articles from database
    let query = db
      .select()
      .from(blogArticles)
      .where(eq(blogArticles.status, 'published'))
      .orderBy(desc(blogArticles.publishedAt))
      .limit(limit)
      .offset((page - 1) * limit);

    // Apply filters
    if (category) {
      query = query.where(eq(blogArticles.category, category)) as any;
    }

    const articles = await query;

    // If no articles in database, fallback to markdown files
    if (articles.length === 0) {
      console.log('No articles in database, loading from markdown files');
      const markdownArticles = getAllArticles();

      // Apply filters to markdown articles
      let filteredArticles = markdownArticles;
      if (category) {
        filteredArticles = filteredArticles.filter(
          article => article.frontmatter.category === category
        );
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const paginatedArticles = filteredArticles.slice(startIndex, startIndex + limit);

      // Transform to API format
      const transformedArticles = paginatedArticles.map(article => ({
        slug: article.slug,
        title: article.frontmatter.title,
        excerpt: article.frontmatter.excerpt,
        author: article.frontmatter.author,
        authorCredentials: article.frontmatter.authorCredentials,
        date: article.frontmatter.date,
        readTime: article.frontmatter.readTime,
        category: article.frontmatter.category,
        tags: article.frontmatter.tags,
        featuredImage: article.frontmatter.featuredImage,
        metaDescription: article.frontmatter.metaDescription,
        views: 0,
        likes: 0
      }));

      return res.json({
        articles: transformedArticles,
        pagination: {
          page,
          limit,
          total: filteredArticles.length,
          totalPages: Math.ceil(filteredArticles.length / limit)
        }
      });
    }

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogArticles)
      .where(eq(blogArticles.status, 'published'));

    const total = Number(totalResult[0]?.count || 0);

    res.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

/**
 * GET /api/blog/articles/:slug
 * Get single article by slug and increment view count
 */
router.get('/articles/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Try to get from database first
    const articles = await db
      .select()
      .from(blogArticles)
      .where(and(
        eq(blogArticles.slug, slug),
        eq(blogArticles.status, 'published')
      ))
      .limit(1);

    if (articles.length > 0) {
      const article = articles[0];

      // Increment view count
      await db
        .update(blogArticles)
        .set({ views: sql`${blogArticles.views} + 1` })
        .where(eq(blogArticles.id, article.id));

      res.json({ article });
    } else {
      // Fallback to markdown files
      const markdownArticle = parseMarkdownFile(slug);

      if (!markdownArticle) {
        return res.status(404).json({ error: 'Article not found' });
      }

      res.json({
        article: {
          ...markdownArticle.frontmatter,
          content: markdownArticle.content,
          slug: markdownArticle.slug,
          views: 0,
          likes: 0
        }
      });
    }
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

/**
 * GET /api/blog/articles/:slug/related
 * Get related articles based on tags and category
 */
router.get('/articles/:slug/related', async (req, res) => {
  try {
    const { slug } = req.params;
    const limit = parseInt(req.query.limit as string) || 3;

    // Get related from markdown files
    const relatedArticles = getRelatedArticles(slug, limit);

    res.json({ articles: relatedArticles });
  } catch (error) {
    console.error('Error fetching related articles:', error);
    res.status(500).json({ error: 'Failed to fetch related articles' });
  }
});

/**
 * POST /api/blog/articles/:articleId/like
 * Like an article
 */
router.post('/articles/:articleId/like', async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user?.id;
    const sessionId = req.sessionID;

    // Check if already liked
    const existingLike = await db
      .select()
      .from(blogArticleLikes)
      .where(
        and(
          eq(blogArticleLikes.articleId, articleId),
          userId
            ? eq(blogArticleLikes.userId, userId)
            : eq(blogArticleLikes.sessionId, sessionId)
        )
      )
      .limit(1);

    if (existingLike.length > 0) {
      return res.status(400).json({ error: 'Already liked' });
    }

    // Add like
    await db.insert(blogArticleLikes).values({
      articleId,
      userId: userId || null,
      sessionId: userId ? null : sessionId
    });

    // Increment article like count
    await db
      .update(blogArticles)
      .set({ likes: sql`${blogArticles.likes} + 1` })
      .where(eq(blogArticles.id, articleId));

    res.json({ success: true });
  } catch (error) {
    console.error('Error liking article:', error);
    res.status(500).json({ error: 'Failed to like article' });
  }
});

// ============================================
// PUBLIC ROUTES - Comments
// ============================================

/**
 * GET /api/blog/articles/:articleId/comments
 * Get approved comments for an article
 */
router.get('/articles/:articleId/comments', async (req, res) => {
  try {
    const { articleId } = req.params;

    const comments = await db
      .select()
      .from(blogComments)
      .where(
        and(
          eq(blogComments.articleId, articleId),
          eq(blogComments.status, 'approved')
        )
      )
      .orderBy(desc(blogComments.createdAt));

    res.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * POST /api/blog/articles/:articleId/comments
 * Submit a new comment (requires moderation)
 */
router.post('/articles/:articleId/comments', async (req, res) => {
  try {
    const { articleId } = req.params;
    const { content, guestName, guestEmail, parentId } = req.body;
    const userId = req.user?.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (!userId && (!guestName || !guestEmail)) {
      return res.status(400).json({
        error: 'Name and email are required for guest comments'
      });
    }

    const comment = await db.insert(blogComments).values({
      articleId,
      userId: userId || null,
      guestName: userId ? null : guestName,
      guestEmail: userId ? null : guestEmail,
      content: content.trim(),
      parentId: parentId || null,
      status: 'pending' // Requires moderation
    }).returning();

    res.json({
      comment: comment[0],
      message: 'Comment submitted for moderation'
    });
  } catch (error) {
    console.error('Error submitting comment:', error);
    res.status(500).json({ error: 'Failed to submit comment' });
  }
});

// ============================================
// PUBLIC ROUTES - Categories
// ============================================

/**
 * GET /api/blog/categories
 * Get all categories with article counts
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await db
      .select()
      .from(blogCategories)
      .orderBy(blogCategories.displayOrder);

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ============================================
// PUBLIC ROUTES - Newsletter
// ============================================

/**
 * POST /api/blog/newsletter/subscribe
 * Subscribe to newsletter
 */
router.post('/newsletter/subscribe', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Check if already subscribed
    const existing = await db
      .select()
      .from(blogNewsletterSubscribers)
      .where(eq(blogNewsletterSubscribers.email, email))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].isActive) {
        return res.status(400).json({ error: 'Email already subscribed' });
      } else {
        // Reactivate subscription
        await db
          .update(blogNewsletterSubscribers)
          .set({ isActive: true, unsubscribedAt: null })
          .where(eq(blogNewsletterSubscribers.email, email));

        return res.json({ message: 'Subscription reactivated' });
      }
    }

    // New subscription
    await db.insert(blogNewsletterSubscribers).values({
      email,
      name: name || null,
      source: 'blog_page'
    });

    res.json({ message: 'Successfully subscribed to newsletter' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// ============================================
// ADMIN ROUTES - Require admin authentication
// ============================================

/**
 * POST /api/blog/admin/articles
 * Create new article (admin only)
 */
router.post('/admin/articles', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const articleData = req.body;

    const article = await db.insert(blogArticles).values({
      ...articleData,
      publishedAt: articleData.status === 'published' ? new Date() : null
    }).returning();

    res.json({ article: article[0] });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

/**
 * PUT /api/blog/admin/articles/:id
 * Update article (admin only)
 */
router.put('/admin/articles/:id', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const updates = req.body;

    const article = await db
      .update(blogArticles)
      .set({
        ...updates,
        updatedAt: new Date(),
        publishedAt: updates.status === 'published' && !updates.publishedAt
          ? new Date()
          : updates.publishedAt
      })
      .where(eq(blogArticles.id, id))
      .returning();

    if (article.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ article: article[0] });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

/**
 * DELETE /api/blog/admin/articles/:id
 * Delete article (admin only)
 */
router.delete('/admin/articles/:id', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    await db.delete(blogArticles).where(eq(blogArticles.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

/**
 * GET /api/blog/admin/comments/pending
 * Get pending comments for moderation (admin only)
 */
router.get('/admin/comments/pending', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const comments = await db
      .select()
      .from(blogComments)
      .where(eq(blogComments.status, 'pending'))
      .orderBy(desc(blogComments.createdAt));

    res.json({ comments });
  } catch (error) {
    console.error('Error fetching pending comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * PUT /api/blog/admin/comments/:id/moderate
 * Moderate comment (admin only)
 */
router.put('/admin/comments/:id/moderate', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { status, moderationNotes } = req.body;

    if (!['approved', 'rejected', 'spam'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const comment = await db
      .update(blogComments)
      .set({
        status,
        moderatedBy: req.user.id,
        moderatedAt: new Date(),
        moderationNotes: moderationNotes || null
      })
      .where(eq(blogComments.id, id))
      .returning();

    if (comment.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ comment: comment[0] });
  } catch (error) {
    console.error('Error moderating comment:', error);
    res.status(500).json({ error: 'Failed to moderate comment' });
  }
});

export default router;
