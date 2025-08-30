import React, { useContext, useState } from "react";
import { ApiContext } from "../../context/apiContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { api } = useContext(ApiContext);
  const navigate=useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    age: "",
    email: "",
  });

  const [verificationMessage, setVerificationMessage] = useState("");

  // handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // send verification email
  const sendVerification = async () => {
    if (!formData.email) {
      setVerificationMessage("Please enter your email first");
      return;
    }

    try {
      const res = await fetch(`${api}/send-login-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!res.ok) {
        const text = await res.text();
        setVerificationMessage(text || "Failed to send verification email");
        return;
      }

      const data = await res.json();
      setVerificationMessage(data.message || "Verification email sent!");
    
    } catch (err) {
      console.error(err);
      setVerificationMessage("Failed to send verification email");
    }
  };

  // Google login handler
  const googleLoginHandler = () => {
    window.location.href = "http://localhost:3000/login_with_google";

  };

  // GitHub login handler
  const githubLoginHandler = () => {
    window.location.href = "http://localhost:3000/login_with_github";
  };

  return (
    <div className="bg-zinc-800 w-full min-h-screen flex flex-col items-center justify-center">
      <h3 className="font-black text-zinc-100 text-center p-4 text-2xl">
        Login to your account
      </h3>

      <form className="bg-zinc-400 shadow-xl text-white border-blue-500 rounded-xl p-6 flex flex-col gap-3">
        <input
          className="px-3 py-2 rounded-md hover:bg-zinc-400 bg-zinc-600 border-2 border-zinc-800 outline-none"
          type="text"
          placeholder="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
        />
        <input
          className="px-3 py-2 rounded-md hover:bg-zinc-400 bg-zinc-600 border-2 border-zinc-800 outline-none"
          type="password"
          placeholder="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
        />
        <input
          className="px-3 py-2 rounded-md hover:bg-zinc-400 bg-zinc-600 border-2 border-zinc-800 outline-none"
          type="number"
          placeholder="age"
          name="age"
          value={formData.age}
          onChange={handleChange}
        />

        <input
          className="px-3 py-2 rounded-md hover:bg-zinc-400 bg-zinc-600 border-2 border-zinc-800 outline-none"
          type="email"
          placeholder="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />

        <div className="mt-2">
          <button
            type="button"
            onClick={sendVerification}
            className="px-3 py-2 rounded-md bg-green-500 text-white"
          >
            Send Verification Email
          </button>
        </div>

        <p className="text-white mt-2">{verificationMessage}</p>
      </form>

      {/* OAuth buttons */}
      <div className="flex flex-col gap-3 mt-4 w-full max-w-xs">
        <button
          className="px-5 py-2 rounded-md bg-blue-500 text-white w-full"
          onClick={googleLoginHandler}
        >
          Login with Google
        </button>

        <button
          className="px-5 py-2 rounded-md bg-gray-800 text-white w-full"
          onClick={githubLoginHandler}
        >
          Login with GitHub
        </button>
      </div>
    </div>
  );
};

export default Login;
