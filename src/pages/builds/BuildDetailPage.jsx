import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate, timeAgo } from '../../utils/helpers';
import { checkCompatibility } from '../../utils/compatibility';

// Build a tree of comments from a flat array
function buildCommentTree(comments) {
  const map = {};
  const roots = [];

  comments.forEach(c => {
    map[c.id] = { ...c, replies: [] };
  });

  comments.forEach(c => {
    if (c.parent_comment_id && map[c.parent_comment_id]) {
      map[c.parent_comment_id].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  return roots;
}

// Render filled/empty stars for a given score out of 5
function StarDisplay({ score }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        className={i <= Math.round(score) ? 'star star--filled' : 'star'}
      >
        &#9733;
      </span>
    );
  }
  return <span className="star-display">{stars}</span>;
}

export default function BuildDetailPage() {
  const { id } = useParams();
  const {
    getItemById, getBuildParts, getRatings, getComments,
    isLiked, toggleLike, addRating, createItem, editItem, getUser, queryItems,
  } = useData();
  const { user, isAuthenticated, isBuilder } = useAuth();

  const [build, setBuild] = useState(null);
  const [parts, setParts] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [comments, setComments] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [compatIssues, setCompatIssues] = useState([]);

  // Rating form
  const [newScore, setNewScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [hasRated, setHasRated] = useState(false);

  // Comment form
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Request form
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestBudget, setRequestBudget] = useState('');
  const [requestPurpose, setRequestPurpose] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [requestCreated, setRequestCreated] = useState(false);

  const loadData = useCallback(() => {
    const b = getItemById('builds', id);
    if (!b) return;
    setBuild(b);
    setLikeCount(b.like_count || 0);

    const bp = getBuildParts(id);
    setParts(bp);

    // Build compatibility map
    const partMap = {};
    bp.forEach(({ part, category }) => {
      if (part && category) {
        partMap[category.slug] = part;
      }
    });
    setCompatIssues(checkCompatibility(partMap));

    setRatings(getRatings(id));
    setComments(getComments(id));

    if (user) {
      setHasLiked(isLiked(user.id, id));
      const allRatings = getRatings(id);
      setHasRated(allRatings.some(r => r.user_id === user.id));
    }
  }, [id, user, getItemById, getBuildParts, getRatings, getComments, isLiked]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleToggleLike = useCallback(() => {
    if (!user) return;
    const nowLiked = toggleLike(user.id, id);
    setHasLiked(nowLiked);
    setLikeCount(prev => nowLiked ? prev + 1 : Math.max(0, prev - 1));
  }, [user, id, toggleLike]);

  const handleSubmitRating = useCallback((e) => {
    e.preventDefault();
    if (!user || newScore === 0) return;
    const result = addRating({
      user_id: user.id,
      build_id: id,
      score: newScore,
      review_text: newReview.trim() || null,
    });
    if (result) {
      setHasRated(true);
      setNewScore(0);
      setHoverScore(0);
      setNewReview('');
      setRatings(getRatings(id));
      // Refresh build to get updated avg
      const updated = getItemById('builds', id);
      if (updated) setBuild(updated);
    }
  }, [user, id, newScore, newReview, addRating, getRatings, getItemById]);

  const handleSubmitComment = useCallback((e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    createItem('comments', {
      build_id: id,
      user_id: user.id,
      parent_comment_id: null,
      content: newComment.trim(),
    });
    setNewComment('');
    setComments(getComments(id));
  }, [user, id, newComment, createItem, getComments]);

  // Check if this build already has an active request (open or claimed)
  const activeRequest = build
    ? queryItems('build_requests', r => r.build_id === build.id && (r.status === 'open' || r.status === 'claimed'))[0]
    : null;
  const hasActiveRequest = !!activeRequest;
  const isOwnRequest = activeRequest && user && activeRequest.user_id === user.id;

  const handleCreateRequest = useCallback((e) => {
    e.preventDefault();
    if (!user || !build) return;
    // Double-check no active request exists (prevent race conditions)
    const existingActive = queryItems('build_requests', r => r.build_id === build.id && (r.status === 'open' || r.status === 'claimed'));
    if (existingActive.length > 0) return;
    createItem('build_requests', {
      build_id: build.id,
      user_id: user.id,
      budget: Number(requestBudget) || 0,
      purpose: requestPurpose.trim() || null,
      notes: requestNotes.trim() || null,
      preferred_builder_id: null,
      status: 'open',
    });
    setRequestCreated(true);
    setShowRequestForm(false);
  }, [user, build, requestBudget, requestPurpose, requestNotes, createItem, queryItems]);

  const handleSubmitReply = useCallback((e) => {
    e.preventDefault();
    if (!user || !replyText.trim() || !replyTo) return;
    createItem('comments', {
      build_id: id,
      user_id: user.id,
      parent_comment_id: replyTo,
      content: replyText.trim(),
    });
    setReplyTo(null);
    setReplyText('');
    setComments(getComments(id));
  }, [user, id, replyTo, replyText, createItem, getComments]);

  if (!build) {
    return (
      <div className="page">
        <h1>Build Not Found</h1>
        <p>The build you are looking for does not exist or has been removed.</p>
        <Link to="/builds" className="btn btn--primary">Back to Builds</Link>
      </div>
    );
  }

  const creator = getUser(build.user_id);
  const isOwner = user && user.id === build.user_id;
  const totalPrice = parts.reduce((sum, bp) => sum + (bp.part ? bp.part.price : 0), 0);
  const commentTree = buildCommentTree(comments);
  const errors = compatIssues.filter(i => i.severity === 'error');
  const warnings = compatIssues.filter(i => i.severity === 'warning');

  return (
    <div className="page">
      <div className="build-detail">
        <div className="build-detail__main">
          {/* Header */}
          <div className="build-detail__header">
            <h1>{build.title}</h1>
            {build.purpose && (
              <span className="badge badge--secondary">{build.purpose}</span>
            )}
            <p className="build-detail__author">
              by{' '}
              {creator ? (
                <Link to={`/profile/${creator.id}`}>{creator.display_name}</Link>
              ) : (
                'Unknown'
              )}
              {' '}&middot; {formatDate(build.created_at)}
            </p>
            {build.description && (
              <p className="build-detail__description">{build.description}</p>
            )}
          </div>

          {/* Parts Table */}
          <div className="build-detail__parts">
            <h2>Parts List</h2>
            <table className="parts-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Part</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((bp) => (
                  <tr key={bp.id}>
                    <td>{bp.category ? bp.category.name : 'Unknown'}</td>
                    <td>
                      {bp.part ? (
                        <>
                          <strong>{bp.part.name}</strong>
                          {bp.part.brand && (
                            <span className="parts-table__manufacturer">
                              {' '}({bp.part.brand})
                            </span>
                          )}
                        </>
                      ) : (
                        <em>Part not found</em>
                      )}
                    </td>
                    <td>{bp.part ? formatCurrency(bp.part.price) : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2"><strong>Total</strong></td>
                  <td><strong>{formatCurrency(totalPrice)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Compatibility */}
          {compatIssues.length > 0 && (
            <div className="build-detail__compatibility">
              <h2>Compatibility Check</h2>
              {errors.length > 0 && (
                <div className="compat-issues compat-issues--error">
                  <h3>Errors ({errors.length})</h3>
                  <ul>
                    {errors.map((issue, i) => (
                      <li key={i}>{issue.message}</li>
                    ))}
                  </ul>
                </div>
              )}
              {warnings.length > 0 && (
                <div className="compat-issues compat-issues--warning">
                  <h3>Warnings ({warnings.length})</h3>
                  <ul>
                    {warnings.map((issue, i) => (
                      <li key={i}>{issue.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {compatIssues.length === 0 && parts.length > 0 && (
            <div className="build-detail__compatibility">
              <div className="compat-issues compat-issues--success">
                <p>All parts are compatible!</p>
              </div>
            </div>
          )}

          {/* Social Actions */}
          <div className="social-actions">
            {isAuthenticated && (
              <button
                className={hasLiked ? 'like-btn like-btn--liked' : 'like-btn'}
                onClick={handleToggleLike}
              >
                &#9829; {likeCount}
              </button>
            )}
            {!isAuthenticated && (
              <span className="like-btn like-btn--disabled">&#9829; {likeCount}</span>
            )}
            <span className="social-actions__rating">
              <StarDisplay score={build.rating_avg || 0} />
              {' '}
              {build.rating_avg ? build.rating_avg.toFixed(1) : '0.0'} ({build.rating_count || 0} ratings)
            </span>
          </div>

          {/* Rating Form */}
          {isAuthenticated && !hasRated && !isOwner && (
            <div className="build-detail__rating-form">
              <h2>Rate This Build</h2>
              <form onSubmit={handleSubmitRating}>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={
                        star <= (hoverScore || newScore)
                          ? 'star-rating__star star-rating__star--filled'
                          : 'star-rating__star'
                      }
                      onClick={() => setNewScore(star)}
                      onMouseEnter={() => setHoverScore(star)}
                      onMouseLeave={() => setHoverScore(0)}
                    >
                      &#9733;
                    </button>
                  ))}
                </div>
                <textarea
                  className="form__textarea"
                  placeholder="Write a review (optional)..."
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  rows={3}
                />
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={newScore === 0}
                >
                  Submit Rating
                </button>
              </form>
            </div>
          )}

          {/* Ratings List */}
          {ratings.length > 0 && (
            <div className="build-detail__ratings">
              <h2>Reviews ({ratings.length})</h2>
              <div className="ratings-list">
                {ratings.map(r => {
                  const ratingUser = getUser(r.user_id);
                  return (
                    <div key={r.id} className="rating-item">
                      <div className="rating-item__header">
                        <span className="rating-item__user">
                          {ratingUser ? ratingUser.display_name : 'Unknown User'}
                        </span>
                        <StarDisplay score={r.score} />
                        <span className="rating-item__date">{formatDate(r.created_at)}</span>
                      </div>
                      {r.review_text && (
                        <p className="rating-item__review">{r.review_text}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="build-detail__comments">
            <h2>Comments ({comments.length})</h2>

            {commentTree.length > 0 ? (
              <div className="comments-list">
                {commentTree.map(comment => {
                  const commentAuthor = getUser(comment.user_id);
                  return (
                    <div key={comment.id} className="comment">
                      <div className="comment__header">
                        <span className="comment__author">
                          {commentAuthor ? commentAuthor.display_name : 'Unknown User'}
                        </span>
                        <span className="comment__date">{timeAgo(comment.created_at)}</span>
                      </div>
                      <p className="comment__content">{comment.content}</p>
                      {isAuthenticated && (
                        <button
                          className="comment__reply-btn"
                          onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                        >
                          {replyTo === comment.id ? 'Cancel' : 'Reply'}
                        </button>
                      )}

                      {/* Reply form */}
                      {replyTo === comment.id && (
                        <form className="comment-form comment-form--reply" onSubmit={handleSubmitReply}>
                          <textarea
                            className="form__textarea"
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={2}
                          />
                          <button type="submit" className="btn btn--primary btn--sm" disabled={!replyText.trim()}>
                            Post Reply
                          </button>
                        </form>
                      )}

                      {/* Nested replies */}
                      {comment.replies.length > 0 && (
                        <div className="comment__replies">
                          {comment.replies.map(reply => {
                            const replyAuthor = getUser(reply.user_id);
                            return (
                              <div key={reply.id} className="comment comment--reply">
                                <div className="comment__header">
                                  <span className="comment__author">
                                    {replyAuthor ? replyAuthor.display_name : 'Unknown User'}
                                  </span>
                                  <span className="comment__date">{timeAgo(reply.created_at)}</span>
                                </div>
                                <p className="comment__content">{reply.content}</p>
                                {isAuthenticated && (
                                  <button
                                    className="comment__reply-btn"
                                    onClick={() => setReplyTo(replyTo === reply.id ? null : reply.id)}
                                  >
                                    {replyTo === reply.id ? 'Cancel' : 'Reply'}
                                  </button>
                                )}
                                {replyTo === reply.id && (
                                  <form className="comment-form comment-form--reply" onSubmit={handleSubmitReply}>
                                    <textarea
                                      className="form__textarea"
                                      placeholder="Write a reply..."
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      rows={2}
                                    />
                                    <button type="submit" className="btn btn--primary btn--sm" disabled={!replyText.trim()}>
                                      Post Reply
                                    </button>
                                  </form>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="comments-empty">No comments yet. Be the first to share your thoughts!</p>
            )}

            {/* New comment form */}
            {isAuthenticated && (
              <form className="comment-form" onSubmit={handleSubmitComment}>
                <h3>Add a Comment</h3>
                <textarea
                  className="form__textarea"
                  placeholder="Share your thoughts on this build..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <button type="submit" className="btn btn--primary" disabled={!newComment.trim()}>
                  Post Comment
                </button>
              </form>
            )}
            {!isAuthenticated && (
              <p className="comments-login">
                <Link to="/login">Log in</Link> to leave a comment or rating.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="build-detail__sidebar">
          <div className="card">
            <div className="card__body">
              <h3 className="card__title">Build Info</h3>
              <dl className="info-list">
                <dt>Creator</dt>
                <dd>
                  {creator ? (
                    <Link to={`/profile/${creator.id}`}>{creator.display_name}</Link>
                  ) : (
                    'Unknown'
                  )}
                </dd>
                <dt>Created</dt>
                <dd>{formatDate(build.created_at)}</dd>
                <dt>Status</dt>
                <dd>
                  <span className="badge">{build.status}</span>
                </dd>
                <dt>Total Price</dt>
                <dd>{formatCurrency(totalPrice)}</dd>
              </dl>

              {isOwner && (
                <div className="card__actions">
                  <Link to={`/builds/${build.id}/edit`} className="btn btn--secondary btn--block">
                    Edit Build
                  </Link>
                  {isBuilder && build.status === 'published' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 0' }}>
                      <input
                        type="checkbox"
                        checked={build.build_type === 'showcase'}
                        onChange={() => {
                          const newType = build.build_type === 'showcase' ? 'personal' : 'showcase';
                          editItem('builds', build.id, { build_type: newType });
                          setBuild({ ...build, build_type: newType });
                        }}
                      />
                      Show in Showcase
                    </label>
                  )}
                  {build.status === 'published' && !hasActiveRequest && !requestCreated && (
                    <button
                      className="btn btn--primary btn--block"
                      onClick={() => setShowRequestForm(!showRequestForm)}
                    >
                      {showRequestForm ? 'Cancel' : 'Post to Request Board'}
                    </button>
                  )}
                  {requestCreated && (
                    <div className="alert alert--success">Request posted!</div>
                  )}
                  {hasActiveRequest && !requestCreated && (
                    <p className="text--muted">
                      {isOwnRequest
                        ? 'You already have an active request for this build.'
                        : 'This build already has an active request.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Request Form */}
          {showRequestForm && (
            <div className="card">
              <div className="card__body">
                <h3 className="card__title">Post Request</h3>
                <form onSubmit={handleCreateRequest}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="req-budget">Budget ($)</label>
                    <input
                      id="req-budget"
                      type="number"
                      className="form-input"
                      min="0"
                      step="0.01"
                      value={requestBudget}
                      onChange={(e) => setRequestBudget(e.target.value)}
                      placeholder="Your budget for this build"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="req-purpose">Purpose</label>
                    <input
                      id="req-purpose"
                      type="text"
                      className="form-input"
                      value={requestPurpose}
                      onChange={(e) => setRequestPurpose(e.target.value)}
                      placeholder="e.g., Gaming, Workstation"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="req-notes">Notes</label>
                    <textarea
                      id="req-notes"
                      className="form-input"
                      rows="3"
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      placeholder="Any additional details for the builder"
                    />
                  </div>
                  <button type="submit" className="btn btn--primary btn--block">
                    Submit Request
                  </button>
                </form>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card__body">
              <h3 className="card__title">Share</h3>
              <p className="card__text">
                Share this build with others by copying the URL from your browser address bar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
