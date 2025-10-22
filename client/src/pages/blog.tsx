import { Link } from "wouter";
import { Calendar, Clock, User, ArrowRight, TrendingUp, Heart, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  authorCredentials?: string;
  date: string;
  readTime: number;
  category: string;
  tags: string[];
  featuredImage: string;
}

const CATEGORIES = [
  { name: "All Articles", icon: TrendingUp },
  { name: "Mental Health Tips", icon: Brain },
  { name: "Therapy Insights", icon: Heart },
  { name: "Workplace Wellness", icon: TrendingUp },
  { name: "Getting Started", icon: ArrowRight },
  { name: "Wellness & Self-Care", icon: Heart }
];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch articles
  const { data: articlesData, isLoading } = useQuery<{ articles: BlogArticle[] }>({
    queryKey: ['/api/blog/articles', selectedCategory],
  });

  const articles = articlesData?.articles || [];
  const featuredPost = articles[0];
  const recentPosts = articles.slice(1, 7);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/5 py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 text-sm px-4 py-1">Mental Health Resources & Insights</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              KareMatch Blog
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Expert insights, mental health tips, and the latest research to support your wellness journey
            </p>

            {/* Newsletter Signup */}
            <Card className="max-w-2xl mx-auto shadow-lg">
              <CardContent className="p-6">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const email = formData.get('email') as string;

                  try {
                    const response = await fetch('/api/blog/newsletter/subscribe', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email })
                    });

                    if (response.ok) {
                      alert('Successfully subscribed to newsletter!');
                      e.currentTarget.reset();
                    } else {
                      const error = await response.json();
                      alert(error.error || 'Subscription failed');
                    }
                  } catch (error) {
                    console.error('Subscription error:', error);
                    alert('Failed to subscribe. Please try again.');
                  }
                }}>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email for weekly insights"
                      required
                      className="flex-1 h-12 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button type="submit" size="lg" className="h-12 px-8 whitespace-nowrap">
                      Subscribe
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Join our community of mental health professionals and wellness enthusiasts
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="border-b bg-card/50">
        <div className="container mx-auto px-4 max-w-7xl py-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {CATEGORIES.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "outline"}
                className="gap-2"
                onClick={() => setSelectedCategory(
                  selectedCategory === category.name ? null : category.name
                )}
              >
                <category.icon className="h-4 w-4" />
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-7xl">
            <Skeleton className="h-96 w-full mb-8" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80 w-full" />
              ))}
            </div>
          </div>
        </section>
      ) : articles.length === 0 ? (
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-7xl text-center">
            <p className="text-xl text-muted-foreground">
              No articles found. Check back soon!
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* Featured Article */}
          {featuredPost && (
            <section className="py-12 md:py-16">
              <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex items-center gap-2 mb-8">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold">Featured Article</h2>
                </div>

                <Link href={`/blog/${featuredPost.slug}`}>
                  <Card className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer group">
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="relative h-64 md:h-full overflow-hidden">
                        <img
                          src={featuredPost.featuredImage}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <Badge className="absolute top-4 left-4">{featuredPost.category}</Badge>
                      </div>
                      <CardContent className="p-8 md:p-10 flex flex-col justify-center">
                        <h3 className="text-3xl md:text-4xl font-bold mb-4 group-hover:text-primary transition-colors">
                          {featuredPost.title}
                        </h3>
                        <p className="text-muted-foreground text-lg mb-6">
                          {featuredPost.excerpt}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {featuredPost.author}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(featuredPost.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {featuredPost.readTime} min read
                          </div>
                        </div>
                        <Button size="lg" className="w-fit gap-2">
                          Read Article
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              </div>
            </section>
          )}

          {/* Recent Articles Grid */}
          {recentPosts.length > 0 && (
            <section className="py-12 md:py-16 bg-card/30">
              <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold">Recent Articles</h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentPosts.map((post) => (
                    <Link key={post.slug} href={`/blog/${post.slug}`}>
                      <Card className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer group h-full flex flex-col">
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <Badge className="absolute top-4 left-4 text-xs">{post.category}</Badge>
                        </div>
                        <CardContent className="p-6 flex-1 flex flex-col">
                          <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-muted-foreground mb-4 flex-1 line-clamp-3">
                            {post.excerpt}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-4 border-t">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{post.author.split(' ')[1]}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(post.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.readTime} min
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Wellness Journey?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with licensed mental health professionals who can provide personalized support for your unique needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/therapists">
                Find a Therapist
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/match">
                Take Our Quiz
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
