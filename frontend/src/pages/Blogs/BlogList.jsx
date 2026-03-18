
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGetBlogsQuery, useToggleReactionMutation } from "../../api/apiSlice";
import Loader from "../../components/Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Paginations";
import AddBlogModal from "./AddBlogModal";
import { FaSearch } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL;
const WS_URL = import.meta.env.VITE_WS_URL;

const BlogList = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [reactionState, setReactionState] = useState({});

  const reactionWS = useRef(null);
  const notificationWS = useRef(null);
  const reconnectTimer = useRef(null);

  // =====================================================
  // 🟢 Fetch Categories
  // =====================================================
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories/`);
      const data = await res.json();
      const categoryList = Array.isArray(data)
        ? data.map((cat) => cat.name)
        : data?.categories?.map((cat) => cat.name) || [];
      setCategories(["All", ...categoryList]);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // =====================================================
  // 🧠 Fetch Blogs via RTK Query
  // =====================================================
  const { data: blogsData, isLoading, isError, refetch } = useGetBlogsQuery({
    page: currentPage,
    category: selectedCategory !== "All" ? selectedCategory : "",
    search: searchQuery,
    tag: selectedTag,
  });

  const [toggleReaction] = useToggleReactionMutation();
  const blogs = blogsData?.results || [];
  const totalCount = blogsData?.count || 0;
  const totalPages = Math.ceil(totalCount / 10);

  // =====================================================
  // 🔄 Pagination & Re-fetch
  // =====================================================
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    refetch();
  }, [currentPage, selectedCategory, searchQuery, selectedTag, refetch]);

  // =====================================================
  // 🧩 Initialize Reaction State
  // =====================================================
  useEffect(() => {
    if (blogs.length > 0) {
      const initial = {};
      blogs.forEach((b) => {
        initial[b.id] = {
          userReaction: b.user_reaction || null,
          reactionCounts: b.reaction_summary || {
            like: 0,
            love: 0,
            laugh: 0,
            angry: 0,
          },
        };
      });
      setReactionState(initial);
    }
  }, [blogs]);

  // =====================================================
  // ⚡ WebSocket Setup (Reaction + Notification)
  // =====================================================
  const setupWebSocket = useCallback(() => {
    // Reaction Socket
    const reactionSocket = new WebSocket(`${WS_URL}/ws/reactions/`);
    reactionWS.current = reactionSocket;

    reactionSocket.onopen = () => console.log("✅ Reaction WS connected");
    reactionSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "reaction_update" && data.data) {
          const { blog, emoji, user } = data.data;

          setReactionState((prev) => {
            const b = prev[blog];
            if (!b) return prev;
            const counts = { ...b.reactionCounts };
            if (counts[emoji] !== undefined) counts[emoji] += 1;
            return { ...prev, [blog]: { ...b, reactionCounts: counts } };
          });

          toast.info(`💥 ${user} reacted ${emoji} on a blog!`, {
            autoClose: 1800,
          });
        }
      } catch (err) {
        console.error("Reaction WS error:", err);
      }
    };
    reactionSocket.onclose = () => {
      console.warn("❌ Reaction WS closed. Reconnecting...");
      reconnectTimer.current = setTimeout(setupWebSocket, 3000);
    };

    // Notification Socket
    const notificationSocket = new WebSocket(`${WS_URL}/ws/notifications/`);
    notificationWS.current = notificationSocket;

    notificationSocket.onopen = () => console.log("✅ Notification WS connected");
    notificationSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification_update") {
          toast.info(`🔔 ${data.message}`, { autoClose: 2000 });
        }
      } catch (err) {
        console.error("Notification WS error:", err);
      }
    };
    notificationSocket.onclose = () => {
      console.warn("❌ Notification WS closed. Reconnecting...");
      reconnectTimer.current = setTimeout(setupWebSocket, 3000);
    };
  }, []);

  useEffect(() => {
    setupWebSocket();
    return () => {
      clearTimeout(reconnectTimer.current);
      clearTimeout(notificationWS.current);
      reactionWS.current?.close();
      notificationWS.current?.close();
    };
  }, [setupWebSocket]);

  // =====================================================
  // ❤️ Handle Reaction
  // =====================================================
  const handleReaction = async (blogId, reactionType) => {
    if (!token) {
      toast.error("Please login to react on blogs");
      return;
    }

    // UI Optimistic Update
    setReactionState((prev) => {
      const curr = prev[blogId];
      const prevType = curr?.userReaction;
      const counts = { ...curr.reactionCounts };

      if (prevType) counts[prevType] = Math.max(0, counts[prevType] - 1);
      if (prevType !== reactionType) counts[reactionType]++;

      return {
        ...prev,
        [blogId]: {
          userReaction: prevType === reactionType ? null : reactionType,
          reactionCounts: counts,
        },
      };
    });

    try {
      await toggleReaction({ blogId, reactionType }).unwrap();
      if (reactionWS.current?.readyState === WebSocket.OPEN) {
        reactionWS.current.send(
          JSON.stringify({
            emoji: reactionType,
            blog: blogId,
            user: "You",
          })
        );
      }
    } catch (err) {
      console.error("Reaction Error:", err);
      toast.error("Failed to react. Try again later.");
    }
  };

  // =====================================================
  // 📖 Navigation
  // =====================================================
  const handleReadMore = (id) => {
    if (!token) navigate("/auth/login");
    else navigate(`/blogs/${id}`);
  };

  // =====================================================
  // 🧩 Render
  // =====================================================
  if (isLoading)
    return (
      <div className="flex justify-center mt-20">
        <Loader />
      </div>
    );

  if (isError)
    return (
      <p className="text-center text-red-600 mt-10">
        Failed to load blogs. Please try again later.
      </p>
    );

  return (
    <div className="max-w-7xl mx-auto mt-10 px-4 relative">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-800">📚 All Blogs</h2>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {categories.map((cat, i) => (
            <option key={i} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Add Blog Button */}
        {token && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            ➕ Add Blog
          </button>
        )}
      </div>

      {/* Blogs Grid */}
      {blogs.length === 0 ? (
        <p className="text-center text-gray-600 mt-10">No blogs found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => {
            const authorName =
              typeof blog.author === "string"
                ? blog.author
                : blog.author?.username || "Unknown";

            const imageUrl =
              blog.media?.[0]?.file ||
              (blog.featured_image?.startsWith("http")
                ? blog.featured_image
                : `${API_URL}${blog.featured_image}`) ||
              "/fallback.jpg";

            const localState = reactionState[blog.id];
            const counts = localState?.reactionCounts || {
              like: 0,
              love: 0,
              laugh: 0,
              angry: 0,
            };
            const userReaction = localState?.userReaction;

            const reactions = [
              { type: "like", emoji: "👍" },
              { type: "love", emoji: "❤️" },
              { type: "laugh", emoji: "😂" },
              { type: "angry", emoji: "😡" },
            ];

            return (
              <div
                key={blog.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <img
                  src={imageUrl}
                  alt={blog.title}
                  className="h-52 w-full object-cover rounded-t-xl transition-transform duration-300 hover:scale-105"
                />
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-2">
                    ✍️ {authorName} •{" "}
                    {blog.created_at
                      ? new Date(blog.created_at).toLocaleDateString()
                      : "Unknown Date"}
                  </p>
                  <p className="text-gray-700 text-sm flex-grow mb-3 line-clamp-3">
                    {blog.content?.replace(/<[^>]+>/g, "").slice(0, 120)}...
                  </p>

                  {/* Reactions */}
                  <div className="flex justify-between items-center text-gray-600 text-sm mb-3 flex-wrap gap-2">
                    {reactions.map(({ type, emoji }) => (
                      <button
                        key={type}
                        onClick={() => handleReaction(blog.id, type)}
                        className={`px-2 py-1 rounded-full flex items-center gap-1 border ${
                          userReaction === type
                            ? "bg-indigo-600 text-white border-indigo-600 scale-105"
                            : "bg-gray-100 hover:bg-gray-200 border-gray-300"
                        }`}
                      >
                        <span>{emoji}</span>
                        <span>{counts[type] || 0}</span>
                      </button>
                    ))}
                    <span>💬 {blog.total_comments || 0} Comments</span>
                  </div>

                  <button
                    onClick={() => handleReadMore(blog.id)}
                    className="mt-3 text-yellow-500 hover:text-yellow-400 font-semibold"
                  >
                    Read More →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Paginations
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Add Blog Modal */}
      {showAddModal && (
        <AddBlogModal
          onClose={() => {
            setShowAddModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default BlogList;










