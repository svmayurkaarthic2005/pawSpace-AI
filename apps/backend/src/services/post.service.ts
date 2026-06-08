import { postRepository, CreatePostData } from '../repositories/post.repository';
import { commentRepository } from '../repositories/comment.repository';
import { followRepository } from '../repositories/follow.repository';
import { cacheService } from './cache.service';
import { fcmService } from './fcm.service';
import { notificationService } from './notification.service';
import { uploadImage, deleteImages } from '../utils/cloudinary.util';
import { AppError } from '../middleware/error';
import { IPost } from '../models/post.model';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreatePostInput {
  caption?: string;
  hashtags?: string[];
  petId?: string;
  location?: { name: string; coordinates: [number, number] };
  visibility?: 'public' | 'followers';
  isAI?: boolean;
}

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

// ─── Hashtag Extraction ───────────────────────────────────────────────────────

const extractHashtags = (caption: string): string[] => {
  const matches = caption.match(/#[a-zA-Z0-9_]+/g) ?? [];
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))];
};

// ─── Service ──────────────────────────────────────────────────────────────────

export class PostService {
  /**
   * Create a post: upload images to Cloudinary, save to DB,
   * then invalidate feed caches for all followers.
   */
  async createPost(
    userId: string,
    input: CreatePostInput,
    files: UploadedFile[],
  ): Promise<IPost> {
    // Upload all images in parallel
    const mediaItems = await Promise.all(
      files.map(async (file) => {
        const isVideo = file.mimetype.startsWith('video/');
        if (isVideo) {
          const { uploadVideo } = await import('../utils/cloudinary.util');
          const result = await uploadVideo(file.buffer, 'pawspace/posts');
          return { url: result.url, publicId: result.publicId, type: 'video' as const, thumbnail: result.thumbnail };
        }
        const result = await uploadImage(file.buffer, 'pawspace/posts');
        return { url: result.url, publicId: result.publicId, type: 'image' as const };
      }),
    );

    // Extract hashtags from caption
    const caption = input.caption ?? '';
    const captionHashtags = extractHashtags(caption);
    const allHashtags = [...new Set([...(input.hashtags ?? []), ...captionHashtags])];

    const postData: CreatePostData = {
      author: userId,
      caption,
      hashtags: allHashtags,
      media: mediaItems,
      visibility: input.visibility ?? 'public',
      isAI: input.isAI ?? false,
      ...(input.petId && { pet: input.petId }),
      ...(input.location && { location: input.location }),
    };

    const post = await postRepository.create(postData);

    // Invalidate own feed + all followers' feeds
    await Promise.all([
      cacheService.invalidateFeed(userId),
      cacheService.invalidateFollowerFeeds(userId),
    ]);

    return post;
  }

  /**
   * Get paginated feed. Checks Redis cache first (5 min TTL).
   */
  async getFeed(
    userId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<{ items: IPost[]; nextCursor: string | null; hasMore: boolean }> {
    // Only cache the first page (no cursor)
    if (!cursor) {
      const cached = await cacheService.getFeed(userId);
      if (cached) {
        const parsed = JSON.parse(cached) as {
          items: IPost[];
          nextCursor: string | null;
          hasMore: boolean;
        };
        return parsed;
      }
    }

    const followingIds = await followRepository.getFollowingIds(userId);
    const result = await postRepository.getFeed(userId, followingIds, limit, cursor);

    // Cache only the first page
    if (!cursor) {
      await cacheService.setFeed(userId, [result], 300);
    }

    return result;
  }

  /**
   * Toggle like on a post. Invalidates the author's feed cache.
   */
  async likePost(
    userId: string,
    postId: string,
  ): Promise<{ likesCount: number; liked: boolean }> {
    const post = await postRepository.findById(postId);
    if (!post) throw new AppError('Post not found', 404, true, 'POST_NOT_FOUND');

    const result = await postRepository.toggleLike(postId, userId);

    // Create notification if this is a new like (not self-like)
    if (post.author.toString() !== userId && result.liked) {
      // Fire-and-forget notification
      notificationService.createNotification({
        recipient: post.author.toString(),
        sender: userId,
        type: 'like',
        entityId: postId,
        entityType: 'Post',
        entityImage: post.media[0]?.url,
        entityName: (post as any).pet?.name ?? post.caption?.slice(0, 50),
      }).catch(err => console.error('[likePost] Notification error:', err));

      // Fire-and-forget FCM
      fcmService.sendToUser(post.author.toString(), {
        type: 'new_like',
        postId,
        likerName: 'Someone',
      });
    }

    // Invalidate feed caches
    await Promise.all([
      cacheService.invalidateFeed(userId),
      cacheService.invalidateFeed(post.author.toString()),
    ]);

    return result;
  }

  /**
   * Add a comment to a post.
   */
  async createComment(userId: string, postId: string, text: string, parentCommentId?: string) {
    const post = await postRepository.findById(postId);
    if (!post) throw new AppError('Post not found', 404, true, 'POST_NOT_FOUND');

    const comment = await commentRepository.create({
      post: postId,
      author: userId,
      text,
      ...(parentCommentId && { parentComment: parentCommentId }),
    });

    // Bump comment count on post
    await postRepository.incrementCommentCount(postId);

    // Create notification for post author (if not self-comment)
    if (post.author.toString() !== userId) {
      notificationService.createNotification({
        recipient: post.author.toString(),
        sender: userId,
        type: 'comment',
        entityId: postId,
        entityType: 'Post',
        entityImage: post.media[0]?.url,
        entityName: text.slice(0, 80),
      }).catch(err => console.error('[createComment] Notification error:', err));

      // Fire-and-forget FCM
      fcmService.sendToUser(post.author.toString(), {
        type: 'new_comment',
        postId,
        commenterName: 'Someone',
        commentPreview: text.slice(0, 80),
      });
    }

    // If it's a reply, bump repliesCount on parent
    if (parentCommentId) {
      await commentRepository.incrementRepliesCount(parentCommentId);
    }

    return comment;
  }

  /**
   * Delete a post. Verifies ownership, removes Cloudinary assets, deletes from DB.
   */
  async deletePost(userId: string, postId: string): Promise<void> {
    const post = await postRepository.findById(postId);
    if (!post) throw new AppError('Post not found', 404, true, 'POST_NOT_FOUND');

    if (post.author.toString() !== userId) {
      throw new AppError('You can only delete your own posts', 403, true, 'FORBIDDEN');
    }

    // Delete all Cloudinary assets
    const publicIds = post.media.map((m) => m.publicId).filter(Boolean);
    if (publicIds.length > 0) {
      await deleteImages(publicIds);
    }

    await postRepository.deleteById(postId);

    // Invalidate caches
    await Promise.all([
      cacheService.invalidateFeed(userId),
      cacheService.invalidateFollowerFeeds(userId),
    ]);
  }

  async getPostById(postId: string, requestingUserId?: string) {
    const post = await postRepository.findById(postId);
    if (!post) throw new AppError('Post not found', 404, true, 'POST_NOT_FOUND');

    let isLiked = false;
    if (requestingUserId) {
      isLiked = await postRepository.isLikedBy(postId, requestingUserId);
    }

    return { ...post.toObject(), isLiked };
  }

  async getExplorePosts(page: number, limit: number) {
    return postRepository.getExplorePosts(page, limit);
  }

  async getPostsByUser(userId: string, page: number, limit: number) {
    return postRepository.getPostsByUser(userId, page, limit);
  }

  async getPostsByHashtag(tag: string, page: number, limit: number) {
    return postRepository.getPostsByHashtag(tag, page, limit);
  }

  async getComments(postId: string, page: number, limit: number, parentCommentId?: string) {
    return commentRepository.findByPost(postId, page, limit, parentCommentId ?? null);
  }
}

export const postService = new PostService();
