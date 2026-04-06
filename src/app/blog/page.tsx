import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { PAGE_SEO, SCHEMA_ORG } from '@/lib/seo/keywords';
import { prisma } from '@/lib/db/prisma';
import BlogListClient from './BlogListClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.blog);

async function getPublishedPosts() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        category: true,
        author: true,
        readTime: true,
        publishedAt: true,
      },
      take: 50,
    });
    return posts.map((p) => ({
      ...p,
      publishedAt: p.publishedAt?.toISOString() ?? null,
    }));
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(SCHEMA_ORG.breadcrumb([
            { name: 'Home', url: 'https://3box.ai' },
            { name: 'Blog', url: 'https://3box.ai/blog' },
          ])),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Career Tips & AI Insights | 3BOX AI Blog',
            description: 'Explore career tips, resume writing advice, interview preparation strategies, and AI technology insights.',
            url: 'https://3box.ai/blog',
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: posts.map((post, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `https://3box.ai/blog/${post.slug}`,
                name: post.title,
              })),
            },
          }),
        }}
      />
      <BlogListClient initialPosts={posts} />
    </>
  );
}
