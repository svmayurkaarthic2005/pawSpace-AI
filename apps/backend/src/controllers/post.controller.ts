import { Request, Response, NextFunction } from 'express';
import { postService } from '../services/post.service';
import { AppError } from '../middleware/error';
import { successResponse } from '../utils';

export const createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');

    const files = (req.files as Express.Multer.File[]) ?? [];
    const uploadedFiles = files.map((f) => ({
      buffer: f.buffer,
      mimetype: f.mimetype,
      originalname: f.originalname,
    }));

    const body = req.body as {
      caption?: string;
      hashtags?: string | string[];
      petId?: string;
      locationName?: string;
      locationLng?: string;
      locationLat?: string;
      visibility?: 'public' | 'followers';
      isAI?: string;
    };

    const hashtags = Array.isArray(body.hashtags)
      ? body.hashtags
      : body.hashtags
      ? [body.hashtags]
      : [];

    const location =
      body.locationName && body.locationLng && body.locationLat
        ? {
            name: body.locationName,
            coordinates: [parseFloat(body.locationLng), parseFloat(body.locationLat)] as [number, number],
          }
        : undefined;

    const post = await postService.createPost(req.user.userId, {
      caption: body.caption,
      hashtags,
      petId: body.petId,
      location,
      visibility: body.visibility,
      isAI: body.isAI === 'true',
    }, uploadedFiles);

    res.status(201).json(successResponse(post, 'Post created successfully'));
  } catch (err) { next(err); }
};

export const getFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const { cursor, limit } = req.query as { cursor?: string; limit?: string };
    const result = await postService.getFeed(req.user.userId, cursor, limit ? parseInt(limit) : 20);
    res.status(200).json(successResponse(result, 'Feed retrieved'));
  } catch (err) { next(err); }
};

export const getExplorePosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query as { page?: string; limit?: string };
    const result = await postService.getExplorePosts(parseInt(page), parseInt(limit));
    res.status(200).json(successResponse(result, 'Explore posts retrieved'));
  } catch (err) { next(err); }
};

export const getPostById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const post = await postService.getPostById(req.params.id, req.user?.userId);
    res.status(200).json(successResponse(post, 'Post retrieved'));
  } catch (err) { next(err); }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    await postService.deletePost(req.user.userId, req.params.id);
    res.status(200).json(successResponse(null, 'Post deleted'));
  } catch (err) { next(err); }
};

export const likePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const result = await postService.likePost(req.user.userId, req.params.id);
    res.status(200).json(successResponse(result, result.liked ? 'Post liked' : 'Post unliked'));
  } catch (err) { next(err); }
};

export const addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const { text, parentCommentId } = req.body as { text: string; parentCommentId?: string };
    if (!text?.trim()) throw new AppError('Comment text is required', 400, true, 'VALIDATION_ERROR');
    const comment = await postService.createComment(req.user.userId, req.params.id, text, parentCommentId);
    res.status(201).json(successResponse(comment, 'Comment added'));
  } catch (err) { next(err); }
};

export const getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '20', parentCommentId } = req.query as {
      page?: string; limit?: string; parentCommentId?: string;
    };
    const result = await postService.getComments(req.params.id, parseInt(page), parseInt(limit), parentCommentId);
    res.status(200).json(successResponse(result, 'Comments retrieved'));
  } catch (err) { next(err); }
};

export const getHashtagSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q } = req.query as { q?: string };
    const popularHashtags = ['dogsofinstagram', 'catsofinstagram', 'petstagram', 'doglife', 'cutepets'];
    
    if (!q || q.trim().length === 0) {
      res.status(200).json(successResponse(popularHashtags, 'Popular hashtags'));
      return;
    }

    // Aggregate distinct hashtags matching the query
    const Post = (await import('../models/post.model')).Post;
    const regex = new RegExp(`^${q.trim()}`, 'i');
    
    const results = await Post.aggregate([
      { $unwind: '$hashtags' },
      { $match: { hashtags: regex } },
      { $group: { _id: '$hashtags' } },
      { $limit: 8 },
      { $project: { _id: 0, hashtag: '$_id' } },
    ]).exec();

    const hashtags = results.map((r: any) => r.hashtag);
    res.status(200).json(successResponse(hashtags.length > 0 ? hashtags : popularHashtags.slice(0, 5), 'Hashtag suggestions'));
  } catch (err) { next(err); }
};
