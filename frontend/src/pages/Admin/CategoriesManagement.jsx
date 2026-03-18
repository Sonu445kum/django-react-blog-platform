
import React, { useState } from "react";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateDeleteCategoryMutation,
  useDeleteCategoryMutation,
} from "../../api/apiSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Edit, Trash2, PlusCircle } from "lucide-react";
import { toast } from "react-toastify";


const CategoriesManagement = () => {
  const { data: categories = [], isLoading, refetch } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateDeleteCategory] = useUpdateDeleteCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [categoryName, setCategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // 10 default category options
  const defaultOptions = [
    "Technology",
    "Business",
    "Health",
    "Education",
    "Sports",
    "Entertainment",
    "Travel",
    "Food",
    "Lifestyle",
    "Science",
  ];

  // ------------------------
  // CREATE / UPDATE CATEGORY
  // ------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return toast.error("Category name required!");

    try {
      if (selectedCategory) {
        // Update category
        await updateDeleteCategory({
          id: selectedCategory.id,
          data: { name: categoryName },
          method: "PUT",
        }).unwrap();
        toast.success("Category updated successfully!");
      } else {
        // Create new category
        await createCategory({ name: categoryName }).unwrap();
        toast.success("Category added successfully!");
      }
      setCategoryName("");
      setSelectedCategory(null);
      setShowForm(false);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Something went wrong!");
    }
  };

  // ------------------------
  // DELETE CATEGORY
  // ------------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteCategory(id).unwrap();
      toast.success("Category deleted successfully!");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete category!");
    }
  };

  // ------------------------
  // EDIT CATEGORY
  // ------------------------
  const handleEdit = (category) => {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setShowForm(true);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-700">🗂️ Categories Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md"
        >
          <PlusCircle size={20} />
          {showForm ? "Cancel" : "Add Category"}
        </button>
      </div>

      {/* Form Section */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-6 rounded-lg shadow-lg mb-8"
          >
            <div className="mb-4">
              <label className="block text-gray-600 font-medium mb-2">
                Select or Enter Category Name
              </label>

              {/* Dropdown with default options */}
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              >
                <option value="">-- Select from popular categories --</option>
                {defaultOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              {/* Or manually type */}
              <input
                type="text"
                placeholder="Or type new category name..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                {selectedCategory ? "Update Category" : "Create Category"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedCategory(null);
                  setCategoryName("");
                }}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        {isLoading ? (
          <p className="p-4 text-gray-600">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="p-4 text-gray-600">No categories found.</p>
        ) : (
          <table className="min-w-full table-auto">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Category Name</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr
                  key={category.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2 font-medium">{category.name}</td>
                  <td className="px-4 py-2 flex justify-center gap-3">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CategoriesManagement;


