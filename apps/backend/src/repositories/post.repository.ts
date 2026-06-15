import mongoose from 'mongoose';
import { Post, IPost } from '../models/post.model';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreatePostData {
  author: string;
  pet?: string;
  caption?: string;
  hashtags?: string[];
  media?: Array<{ url: string; publicId: string; type: 'image' | 'video'; thumbnail?: string }>;
  location?: { name: string; coordinates: [number, number] };
  visibility?: 'public' | 'followers';
  isAI?: boolean;
}

export interface FeedPost extends Omit<IPost, 'likes'> {
  isLiked: boolean;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const DEFAULT_LIMIT = 20;

// ─── Repository ───────────────────────────────────────────────────────────────

export class PostRepository {
  async create(data: CreatePostData): Promise<IPost> {
    const post = new Post(data);
    return post.save();
  }

  async findById(id: string): Promise<IPost | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Post.findById(id)
      .populate('author', 'username name avatar isVerified')
      .populate('pet', 'name species breed images')
      .exec();
  }

  async updateById(id: string, data: Partial<CreatePostData>): Promise<IPost | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Post.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await Post.findByIdAndDelete(id).exec();
    return result !== null;
  }

  /**
   * Cursor-based feed: posts from followed users + followed pets + own posts, newest first.
   * cursor = createdAt ISO string of the last seen post.
   */
  async getFeed(
    userId: string,
    followedUserIds: string[],
    followedPetIds: string[],
    limit: number = DEFAULT_LIMIT,
    cursor?: string,
    blockedIds: string[] = []
  ): Promise<CursorPage<IPost>> {
    // Convert to ObjectIds
    const authorIds = [
      new mongoose.Types.ObjectId(userId), // Include user's own posts
      ...followedUserIds.map((id) => new mongoose.Types.ObjectId(id)),
    ];

    const petIds = followedPetIds.map((id) => new mongoose.Types.ObjectId(id));

    // Build query: posts from followed users OR posts from followed pets
    const orConditions: mongoose.FilterQuery<IPost>[] = [
      { author: { $in: authorIds } }, // Posts by followed users (or own posts)
    ];

    // Only add pet condition if user follows any pets
    if (petIds.length > 0) {
      orConditions.push({ pet: { $in: petIds } }); // Posts tagged with followed pets
    }

    const query: mongoose.FilterQuery<IPost> = {
      $or: orConditions,
      visibility: { $in: ['public', 'followers'] },
    };

    if (blockedIds && blockedIds.length > 0) {
      query.author = { $nin: blockedIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const items = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('author', 'username name avatar isVerified')
      .populate('pet', 'name species breed images')
      .lean()
      .exec();

    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    const nextCursor =
      hasMore && items.length > 0
        ? (items[items.length - 1] as unknown as { createdAt: Date }).createdAt.toISOString()
        : null;

    return { items: items as unknown as IPost[], nextCursor, hasMore };
  }

  /**
   * Explore: trending posts sorted by likesCount desc.
   */
  async getExplorePosts(
    page: number = 1,
    limit: number = DEFAULT_LIMIT,
    blockedIds: string[] = []
  ): Promise<{ items: IPost[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const query: mongoose.FilterQuery<IPost> = { visibility: 'public' };
    if (blockedIds && blockedIds.length > 0) {
      query.author = { $nin: blockedIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const [items, total] = await Promise.all([
      Post.find(query)
        .sort({ likesCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username name avatar isVerified')
        .populate('pet', 'name species breed images')
        .lean()
        .exec(),
      Post.countDocuments(query),
    ]);
    return { items: items as unknown as IPost[], total };
  }

  async getPostsByUser(
    userId: string,
    page: number = 1,
    limit: number = DEFAULT_LIMIT,
  ): Promise<{ items: IPost[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Post.find({ author: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username name avatar isVerified')
        .populate('pet', 'name species breed images')
        .lean()
        .exec(),
      Post.countDocuments({ author: userId }),
    ]);
    return { items: items as unknown as IPost[], total };
  }

  async getPostsByPet(
    petId: string,
    page: number = 1,
    limit: number = DEFAULT_LIMIT,
  ): Promise<{ items: IPost[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Post.find({ pet: petId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username name avatar isVerified')
        .lean()
        .exec(),
      Post.countDocuments({ pet: petId }),
    ]);
    return { items: items as unknown as IPost[], total };
  }

  async getPostsByHashtag(
    tag: string,
    page: number = 1,
    limit: number = DEFAULT_LIMIT,
  ): Promise<{ items: IPost[]; total: number }> {
    const skip = (page - 1) * limit;
    const normalizedTag = tag.toLowerCase().replace(/^#/, '');
    const [items, total] = await Promise.all([
      Post.find({ hashtags: normalizedTag, visibility: 'public' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username name avatar isVerified')
        .populate('pet', 'name species breed images')
        .lean()
        .exec(),
      Post.countDocuments({ hashtags: normalizedTag, visibility: 'public' }),
    ]);
    return { items: items as unknown as IPost[], total };
  }

  /**
   * Toggle like: add userId if not present, remove if present.
   * Returns the new likesCount.
   */
  async toggleLike(postId: string, userId: string): Promise<{ likesCount: number; liked: boolean }> {
    const post = await Post.findById(postId).select('likes likesCount').exec();
    if (!post) throw new Error('Post not found');

    const userObjId = new mongoose.Types.ObjectId(userId);
    const alreadyLiked = post.likes.some((id) => id.equals(userObjId));

    const update = alreadyLiked
      ? { $pull: { likes: userObjId }, $inc: { likesCount: -1 } }
      : { $addToSet: { likes: userObjId }, $inc: { likesCount: 1 } };

    const updated = await Post.findByIdAndUpdate(postId, update, { new: true })
      .select('likesCount')
      .exec();

    return { likesCount: updated?.likesCount ?? 0, liked: !alreadyLiked };
  }

  async incrementCommentCount(postId: string): Promise<void> {
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } }).exec();
  }

  async decrementCommentCount(postId: string): Promise<void> {
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } }).exec();
  }

  /**
   * Check if a user has liked a post.
   */
  async isLikedBy(postId: string, userId: string): Promise<boolean> {
    const count = await Post.countDocuments({
      _id: postId,
      likes: new mongoose.Types.ObjectId(userId),
    }).exec();
    return count > 0;
  }
}

export const postRepository = new PostRepository();
