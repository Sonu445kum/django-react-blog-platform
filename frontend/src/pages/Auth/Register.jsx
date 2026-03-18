import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRegisterMutation } from "../../api/apiSlice";
import { toast } from "react-toastify";
import Footer from "../../components/Footer";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function Register() {
  const navigate = useNavigate();
  const [register] = useRegisterMutation();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //  Validation
  const validate = () => {
    if (formData.password !== formData.password2) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await register(formData).unwrap();

      toast.success(
        res?.message || "Registration successful! Check your email.",
      );

      navigate("/auth/login");
    } catch (err) {
      console.log("REGISTER ERROR:", err);

      const message =
        err?.data?.detail ||
        err?.data?.error ||
        err?.data?.username?.[0] ||
        err?.data?.email?.[0] ||
        err?.data?.password?.[0] ||
        err?.data?.password2?.[0] ||
        "Registration failed";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow flex justify-center items-center relative">
          {/* Background */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e')",
            }}
          >
            <div className="absolute inset-0 bg-black/50"></div>
          </div>

          {/* Card */}
          <div className="relative w-full max-w-md bg-white p-8 rounded-xl shadow-2xl z-10">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Create an Account
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                className="px-4 py-2 border rounded"
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="px-4 py-2 border rounded"
              />

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="px-4 py-2 border rounded w-full"
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </span>
              </div>

              {/* Confirm Password */}
              <input
                type="password"
                name="password2"
                placeholder="Confirm Password"
                value={formData.password2}
                onChange={handleChange}
                required
                className="px-4 py-2 border rounded"
              />

              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white py-2 rounded font-semibold"
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>

            <p className="mt-4 text-center">
              Already have an account?{" "}
              <Link to="/auth/login" className="text-blue-600">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
