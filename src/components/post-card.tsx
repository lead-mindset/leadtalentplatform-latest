import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { InitialsAvatar } from "@/components/initials-avatar";
import type { Post } from "@/lib/data/community";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-xl border border-border/60 card-surface p-(--card-spacing) shadow-sm">
      <div className="flex items-start gap-3">
        <InitialsAvatar initials={post.author.initials} color={post.author.avatarColor} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{post.author.name}</p>
            {post.pinned && (
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-caption font-medium text-muted-foreground">
                Fijado
              </span>
            )}
          </div>
          <p className="text-small text-muted-foreground">
            {post.author.headline}
            {post.author.headline && post.timeAgo ? " · " : ""}
            {post.timeAgo}
          </p>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-line text-body-lg leading-relaxed">{post.body}</p>

      {post.action && (
        <Link
          href={post.action.href}
          className="mt-4 inline-flex items-center gap-1.5 text-small font-medium text-brand-purple-light hover:underline"
        >
          {post.action.label} <ArrowUpRight className="size-3.5" />
        </Link>
      )}
    </article>
  );
}