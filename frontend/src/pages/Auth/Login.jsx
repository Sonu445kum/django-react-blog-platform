
// import React, { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { useLoginMutation } from "../../api/apiSlice";
// import { toast } from "react-toastify";
// import Footer from "../../components/Footer";

// export default function Login() {
//   const navigate = useNavigate();
//   const [login] = useLoginMutation();

//   const [usernameOrEmail, setUsernameOrEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});

//   // ✅ Validation
//   const validate = () => {
//     const errs = {};
//     if (!usernameOrEmail.trim())
//       errs.usernameOrEmail = "Username or Email is required";
//     if (!password) errs.password = "Password is required";
//     else if (password.length < 6)
//       errs.password = "Password must be at least 6 characters";
//     setErrors(errs);
//     return Object.keys(errs).length === 0;
//   };

//   // ✅ Submit Handler
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validate()) return;
//     setLoading(true);

//     try {
//       const res = await login({
//         username: usernameOrEmail,
//         password,
//       }).unwrap();

//       const user = res.user;

//       if (!user.is_active) {
//         toast.error("Please verify your email before logging in.");
//         setLoading(false);
//         return;
//       }

//       localStorage.setItem("token", res.tokens.access);
//       localStorage.setItem("user", JSON.stringify(user));

//       toast.success("Login successful 🎉");

//       if (user.is_admin) navigate("/admin/dashboard");
//       else navigate("/blogs");
//     } catch (err) {
//       const msg =
//         err?.data?.error ||
//         err?.data?.detail ||
//         "Login failed. Check username/email and password.";
//       toast.error(msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col min-h-screen">
//       <div className="flex-grow flex justify-center items-center relative bg-gray-100">
//         {/* 🌄 Background Image */}
//         <div
//           className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
//           style={{
//             backgroundImage:
//               "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1470')",
//           }}
//         >
//           <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
//         </div>

//         {/* 🧭 Login Card */}
//         <div className="relative w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl z-10 animate-fadeIn">
//           <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
//             Welcome Back 👋
//           </h2>

//           <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//             {/* Username or Email Field */}
//             <div className="flex flex-col">
//               <input
//                 type="text"
//                 placeholder="Username or Email"
//                 value={usernameOrEmail}
//                 onChange={(e) => setUsernameOrEmail(e.target.value)}
//                 className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
//                   errors.usernameOrEmail
//                     ? "border-red-500 focus:ring-red-400"
//                     : "focus:ring-blue-500"
//                 }`}
//               />
//               {errors.usernameOrEmail && (
//                 <span className="text-red-500 text-sm mt-1">
//                   {errors.usernameOrEmail}
//                 </span>
//               )}
//             </div>

//             {/* Password Field */}
//             <div className="flex flex-col">
//               <input
//                 type="password"
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
//                   errors.password
//                     ? "border-red-500 focus:ring-red-400"
//                     : "focus:ring-blue-500"
//                 }`}
//               />
//               {errors.password && (
//                 <span className="text-red-500 text-sm mt-1">
//                   {errors.password}
//                 </span>
//               )}
//               <Link
//                 to="/auth/forgot-password"
//                 className="text-sm text-blue-600 hover:underline mt-2 self-end"
//               >
//                 Forgot password?
//               </Link>
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold mt-2 flex justify-center items-center gap-2 transition"
//             >
//               {loading ? (
//                 <>
//                   <svg
//                     className="animate-spin h-5 w-5 text-white"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     ></circle>
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8v8H4z"
//                     ></path>
//                   </svg>
//                   Logging in...
//                 </>
//               ) : (
//                 "Login"
//               )}
//             </button>
//           </form>

//           {/* Register Redirect */}
//           <p className="mt-4 text-center text-gray-600">
//             Don’t have an account?{" "}
//             <Link
//               to="/auth/register"
//               className="text-blue-600 font-semibold hover:underline"
//             >
//               Register
//             </Link>
//           </p>
//         </div>
//       </div>
//       <Footer />
//     </div>
//   );
// }


import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLoginMutation } from "../../api/apiSlice";
import { toast } from "react-toastify";
import Footer from "../../components/Footer";

export default function Login() {
  const navigate = useNavigate();
  const [login] = useLoginMutation();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  //  Validation
  const validate = () => {
    const errs = {};

    if (!usernameOrEmail.trim()) {
      errs.usernameOrEmail = "Username is required";
    }

    if (!password) {
      errs.password = "Password is required";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  //  Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      /**
       * 🔥 IMPORTANT FIX:
       * Most Django backends expect ONLY "username"
       * NOT email
       */
      const payload = {
        username: usernameOrEmail, // 👈 force username
        password,
      };

      const res = await login(payload).unwrap();

      console.log("LOGIN SUCCESS:", res);

      const user = res?.user;

      //  Store token safely
      if (res?.tokens?.access) {
        localStorage.setItem("token", res.tokens.access);
      }

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      toast.success("Login successful 🎉");

      //  Redirect
      if (user?.is_admin) navigate("/admin/dashboard");
      else navigate("/blogs");

    } catch (err) {
      console.log("LOGIN ERROR FULL:", err);

      /**
       * 🔥 Handle specific backend cases
       */
      let msg = "Login failed";

      if (err?.data) {
        // Django common errors
        if (err.data.detail) msg = err.data.detail;
        else if (err.data.error) msg = err.data.error;
        else if (typeof err.data === "string") msg = err.data;
        else msg = JSON.stringify(err.data);
      }

      // 🔥 Special case: inactive user
      if (msg.toLowerCase().includes("active")) {
        msg = "Account not activated. Please verify your email.";
      }

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow flex justify-center items-center relative bg-gray-100">

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
        <div className="relative w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl z-10">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Welcome Back 👋
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Username */}
            <div>
              <input
                type="text"
                placeholder="Username"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className={`px-4 py-2 border rounded w-full ${
                  errors.usernameOrEmail ? "border-red-500" : ""
                }`}
              />
              {errors.usernameOrEmail && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.usernameOrEmail}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`px-4 py-2 border rounded w-full ${
                  errors.password ? "border-red-500" : ""
                }`}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password}
                </p>
              )}

              <Link
                to="/auth/forgot-password"
                className="text-sm text-blue-600 mt-1 block text-right"
              >
                Forgot password?
              </Link>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-2 rounded font-semibold"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-4 text-center">
            Don’t have an account?{" "}
            <Link to="/auth/register" className="text-blue-600">
              Register
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
