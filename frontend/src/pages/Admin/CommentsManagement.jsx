
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  useGetAllCommentsQuery,
  useDeleteCommentMutation,
  useApproveCommentMutation,
} from "../../api/apiSlice";
import Paginations from "../../components/Paginations";

const CommentsManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  //  Fetch comments with pagination + search + sorting
  const {
    data: commentsData,
    isLoading,
    refetch,
    isFetching,
  } = useGetAllCommentsQuery({
    page: currentPage,
    search: searchTerm,
    sort: sortOrder,
  });

  const [deleteComment] = useDeleteCommentMutation();
  const [approveComment] = useApproveCommentMutation();

  const comments = commentsData?.results || [];
  const totalPages = commentsData?.total_pages || 1;

  //  Handlers
  const handleDelete = async (id) => {
    try {
      setLoadingId(id);
      await deleteComment(id).unwrap();
      toast.success("Comment deleted successfully");
      refetch();
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setLoadingId(null);
    }
  };

  const handleApprove = async (id) => {
    try {
      setLoadingId(id);
      await approveComment(id).unwrap();
      toast.success("Comment approved successfully");
      refetch();
    } catch {
      toast.error("Failed to approve comment");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setSortOrder("");
    setCurrentPage(1);
    refetch();
    toast.info("Comments refreshed");
  };

  //  Debounce search for smoother performance
  useEffect(() => {
    const timer = setTimeout(() => {
      refetch();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, sortOrder, currentPage]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-60 text-gray-700 font-semibold">
        Loading comments...
      </div>
    );

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      {/*  Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h1 className="text-3xl font-bold text-gray-800">
          Comments Management
        </h1>
      </div>

      {/* 🧾 Comments Table */}
      <div className="overflow-x-auto bg-white shadow-xl rounded-2xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600">ID</th>
              <th className="px-4 py-3 text-left text-gray-600">User</th>
              <th className="px-4 py-3 text-left text-gray-600">Blog</th>
              <th className="px-4 py-3 text-left text-gray-600">Comment</th>
              <th className="px-4 py-3 text-left text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-gray-600">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <tr
                  key={comment.id}
                  className={`hover:bg-gray-50 ${
                    isFetching && "opacity-50 transition"
                  }`}
                >
                  <td className="px-4 py-3">{comment.id}</td>
                  <td className="px-4 py-3">{comment.user?.username ?? "Unknown"}</td>
                  <td className="px-4 py-3">{comment.blog?.title ?? "Untitled"}</td>
                  <td className="px-4 py-3">{comment.content ?? "-"}</td>
                  <td className="px-4 py-3 capitalize">
                    {comment.status ?? "pending"}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50 hover:bg-green-600 transition"
                      onClick={() => handleApprove(comment.id)}
                      disabled={
                        loadingId === comment.id || comment.status === "approved"
                      }
                    >
                      Approve
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded disabled:opacity-50 hover:bg-red-600 transition"
                      onClick={() => handleDelete(comment.id)}
                      disabled={loadingId === comment.id}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-gray-500 font-medium"
                >
                  No comments available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Pagination Section */}
      <div className="mt-6 flex justify-center">
        <Paginations
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default CommentsManagement;

