import React, { useEffect, useState } from "react";

const CategoryDropdown = ({ selectedCategory, onChange }) => {
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_URL}/api/categories/`);

        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();

        const fetched =
          data.categories?.map((cat) => cat.name) || [];

        setCategories(["All", ...fetched]);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [API_URL]);

  if (loading) return <p className="text-sm text-gray-500">Loading categories...</p>;

  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <select
      className="border px-3 py-2 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={selectedCategory}
      onChange={(e) => onChange(e.target.value)}
    >
      {categories.map((cat, idx) => (
        <option key={idx} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  );
};

export default CategoryDropdown;