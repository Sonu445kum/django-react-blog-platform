import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useGetBlogQuery,
  useAddCommentMutation,
  useToggleReactionMutation,
  useDeleteBlogMutation,
} from "../../api/apiSlice";
import Loader from "../../components/Loader";
import { UserContext } from "../../context/UserContext";

const API_URL = import.meta.env.VITE_API_URL;
const WS_URL = import.meta.env.VITE_WS_URL;

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  // 🧠 API hooks
  const { data: blog, isLoading, isError, refetch } = useGetBlogQuery(id);
  const [addComment, { isLoading: addingComment }] = useAddCommentMutation();
  const [toggleReaction, { isLoading: reacting }] = useToggleReactionMutation();
  const [deleteBlog] = useDeleteBlogMutation();

  // 💾 Local state
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [reactionCounts, setReactionCounts] = useState({});
  const [userReaction, setUserReaction] = useState(null);

  // 🔒 Auth check
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  // 💬 WebSocket refs
  const ws = useRef(null);
  const reconnectTimer = useRef(null);

  // 🧩 Initialize blog data
  useEffect(() => {
    if (blog) {
      setComments(blog.comments || []);
      setReactionCounts(blog.reaction_summary || {});
      setUserReaction(blog.user_reaction || null);
    }
  }, [blog]);

  // ==========================================================
  // ⚡ WebSocket Connection
  // ==========================================================
  const connectWebSocket = () => {
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socketUrl = `${WS_URL}/ws/blogs/${id}/`;

    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => {
      console.log("✅ WebSocket connected:", socketUrl);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "reaction_update":
          setReactionCounts(data.reaction_summary || {});
          break;

        case "comment_update":
          setComments(data.comments || []);
          break;

        case "notification":
          toast.info(`🔔 ${data.message}`);
          break;

        default:
          console.log("⚙️ Unhandled WS message:", data);
      }
    };

    ws.current.onclose = () => {
      console.warn("🔴 WS disconnected. Retrying...");
      reconnectTimer.current = setTimeout(connectWebSocket, 3000);
    };

    ws.current.onerror = (err) => console.error("❌ WebSocket Error:", err);
  };

 useEffect(() => {
  if (!id) return;

  connectWebSocket();

  return () => {
    if (ws.current) ws.current.close();
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
  };
}, [id, WS_URL]);

  // ==========================================================
  // 🧠 Ownership & Access Control
  // ==========================================================
  const isOwner =
    user &&
    (user.username === blog?.author?.username ||
      user.email === blog?.author?.email);

  const isReactionAllowed = isLoggedIn && !isOwner;

  // ==========================================================
  // ✍️ Add Comment
  // ==========================================================
  const handleAddComment = async () => {
    if (!isLoggedIn) return toast.error("Login required to comment!");
    if (!newComment.trim()) return toast.error("Comment cannot be empty");

    try {
      await addComment({ blogId: id, content: newComment }).unwrap();
      setNewComment("");

      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: "comment_update",
            blog_id: id,
            user: user?.username,
            content: newComment,
          }),
        );
      }

      toast.success("💬 Comment added!");
      refetch();
    } catch (error) {
      toast.error("Failed to post comment");
    }
  };

  // ==========================================================
  // 💖 Toggle Reaction
  // ==========================================================
  const handleReaction = async (reactionType) => {
    if (!isLoggedIn) return toast.error("Login required to react!");
    if (isOwner) return toast.warning("You can’t react on your own blog!");

    const prevReaction = userReaction;
    const newReaction = prevReaction === reactionType ? null : reactionType;

    // ⚡ Optimistic UI update
    setUserReaction(newReaction);
    setReactionCounts((prev) => {
      const updated = { ...prev };
      if (prevReaction)
        updated[prevReaction] = Math.max(0, updated[prevReaction] - 1);
      if (newReaction) updated[newReaction] = (updated[newReaction] || 0) + 1;
      return updated;
    });

    try {
      await toggleReaction({ blogId: id, reactionType }).unwrap();
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: "reaction_update",
            blog_id: id,
            user: user?.username,
            reaction_type: newReaction,
          }),
        );
      }
    } catch (error) {
      toast.error("Failed to react");
      setUserReaction(prevReaction);
    }
  };

  // ==========================================================
  // 🗑️ Delete Blog
  // ==========================================================
  const handleDeleteBlog = async () => {
    if (!isOwner) return toast.error("You can only delete your own blogs!");

    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    try {
      await deleteBlog(id).unwrap();
      toast.success("Blog deleted!");
      navigate("/blogs");
    } catch {
      toast.error("Failed to delete blog");
    }
  };

  // ==========================================================
  // 🧠 Render Section
  // ==========================================================
  if (isLoading)
    return (
      <div className="flex justify-center mt-20">
        <Loader />
      </div>
    );

  if (isError)
    return (
      <p className="text-center text-red-500 mt-10">Error fetching blog.</p>
    );

  if (!blog)
    return <p className="text-center mt-10 text-gray-600">Blog not found.</p>;

  const { title, content, author, views, tags, created_at, media } = blog;

  return (
    <div className="max-w-4xl mx-auto mt-12 p-6 bg-white shadow-lg rounded-2xl">
      {/* ✏️ Edit/Delete (Owner Only) */}
      {isOwner && (
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => navigate(`/blogs/edit/${id}`)}
            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
          >
            ✏️ Edit
          </button>
          <button
            onClick={handleDeleteBlog}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            🗑️ Delete
          </button>
        </div>
      )}

      {/* 🧾 Blog Info */}
      <h1 className="text-3xl font-bold mb-3">{title}</h1>
      <div className="text-sm text-gray-500 mb-4 flex justify-between">
        <span>By {author?.username || "Unknown"}</span>
        <span>{new Date(created_at).toLocaleDateString()}</span>
        <span>👁️ {views || 0} Views</span>
      </div>

      {/* 🏷️ Tags */}
      {tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 🖼️ Media */}
      {media?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {media.map((item) => (
            <img
              key={item.id}
              src={
                item.file.startsWith("http")
                  ? item.file
                  : `${API_URL}${item.file}`
              }
              alt="media"
              className="rounded-lg object-cover w-full h-60 hover:scale-105 transition-transform"
            />
          ))}
        </div>
      )}

      {/* 📝 Content */}
      <div
        className="prose prose-lg text-gray-800 mb-6"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* 💖 Reactions */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {[
          { type: "like", emoji: "👍" },
          { type: "love", emoji: "❤️" },
          { type: "laugh", emoji: "😂" },
          { type: "angry", emoji: "😡" },
        ].map(({ type, emoji }) => (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            disabled={!isReactionAllowed || reacting}
            className={`flex items-center gap-1 px-3 py-2 rounded-full border transition ${
              userReaction === type
                ? "bg-indigo-600 text-white border-indigo-600 scale-105"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300"
            } ${!isReactionAllowed ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="text-lg">{emoji}</span>
            <span>{reactionCounts[type] || 0}</span>
          </button>
        ))}
        <span className="ml-2 text-gray-500">
          💬 {comments.length} Comments
        </span>
      </div>

      {/* ✍️ Add Comment */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Add a Comment</h3>
        <textarea
          rows={3}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write your comment..."
          className="w-full border p-2 rounded mb-2 focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleAddComment}
          disabled={addingComment}
          className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
        >
          {addingComment ? "Posting..." : "Post Comment"}
        </button>
      </div>

      {/* 💭 Comments */}
      {comments.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-3">Comments</h3>
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="border rounded-lg p-3 bg-gray-50"
              >
                <p className="text-gray-700">
                  <strong>{comment.user.username}</strong>: {comment.content}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(comment.created_at).toLocaleString()}
                </p>

                {comment.replies?.length > 0 && (
                  <div className="ml-4 mt-2 space-y-2">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="border-l-2 border-gray-300 pl-2"
                      >
                        <p className="text-gray-700">
                          <strong>{reply.user.username}</strong>:{" "}
                          {reply.content}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(reply.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogDetail;
