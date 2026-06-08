import mongoose from 'mongoose';
import { Comment, IComment } from '../models/comment.model';

export interface CreateCommentData {
  post: string;
  author: string;
  text: string;
  parentComment?: string;
}

const DEFAULT_LIMIT = 20;

export class CommentRepository {
  async create(data: CreateCommentData): Promise<IComment> {
    const comment = new Comment(data);
    const saved = await comment.save();
    return saved.populate('author', 'username name avatar isVerified');
  }

  async findByPost(
    postId: string,
    page: number = 1,
    limit: number = DEFAULT_LIMIT,
    parentComment?: string | null,
  ): Promise<{ items: IComment[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: mongoose.FilterQuery<IComment> = {
      post: postId,
      isDeleted: false,
      parentComment: parentComment ?? null,
    };

    const [items, total] = await Promise.all([
      Comment.find(query)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username name avatar isVerified')
        .lean()
        .exec(),
      Comment.countDocuments(query),
    ]);

    return { items: items as unknown as IComment[], total };
  }

  async findById(id: string): Promise<IComment | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Comment.findById(id).populate('author', 'username name avatar').exec();
  }

  async toggleLike(
    commentId: string,
    userId: string,
  ): Promise<{ likesCount: number; liked: boolean }> {
    const comment = await Comment.findById(commentId).select('likes likesCount').exec();
    if (!comment) throw new Error('Comment not found');

    const userObjId = new mongoose.Types.ObjectId(userId);
    const alreadyLiked = comment.likes.some((id) => id.equals(userObjId));

    const update = alreadyLiked
      ? { $pull: { likes: userObjId }, $inc: { likesCount: -1 } }
      : { $addToSet: { likes: userObjId }, $inc: { likesCount: 1 } };

    const updated = await Comment.findByIdAndUpdate(commentId, update, { new: true })
      .select('likesCount')
      .exec();

    return { likesCount: updated?.likesCount ?? 0, liked: !alreadyLiked };
  }

  async delete(commentId: string): Promise<void> {
    await Comment.findByIdAndUpdate(commentId, { $set: { isDeleted: true } }).exec();
  }

  async incrementRepliesCount(commentId: string): Promise<void> {
    await Comment.findByIdAndUpdate(commentId, { $inc: { repliesCount: 1 } }).exec();
  }
}

export const commentRepository = new CommentRepository();
