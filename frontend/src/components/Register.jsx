import React from 'react'
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
// import './App.css';
import { ApiContext } from '../../context/apiContext';

const Register = () => {
    const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // ✅ useContext hook to get api from context
  const { api } = useContext(ApiContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      username: e.target.username.value,
      email: e.target.email.value,
      password: e.target.password.value,
      age: e.target.age.value
    };

    try {
      const res = await fetch(`${api}/create`, {    //http://localhost:5173/http://localhost:3000/create
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setMessage("✅ User created successfully!");
        e.target.reset();
       navigate('/')
      } else {
        const result = await res.text();
        setMessage(`⚠️ Error: ${result}`);
      }
    } catch (err) {
      setMessage(`⚠️ Error: ${err.message}`);
    }
  };
  return (
    <div className="bg-zinc-800 w-full h-full min-h-screen flex justify-center items-center">
      <div className="w-full max-w-md">
        <h3 className="font-black text-zinc-100 text-center p-4 text-2xl">Create User</h3>
        <form
          className="bg-zinc-400 shadow-xl text-white border-blue-500 rounded-xl p-4 flex flex-col gap-3"
          onSubmit={handleSubmit}
        >
          <input
            className="px-3 py-2 rounded-md hover:bg-zinc-400 bg-zinc-600 border-2 border-zinc-800 outline-none"
            type="text"
            placeholder="username"
            name="username"
            required
          />
          <input
            className="px-3 py-2 rounded-md hover:bg-zinc-400 bg-zinc-600 border-2 border-zinc-800 outline-none"
            type="email"
            placeholder="email"
            name="email"
            required
          />
          <input
            className="px-3 py-2 rounded-md hover:bg-zinc-400 bg-zinc-600 border-2 border-zinc-800 outline-none"
            type="password"
            placeholder="password"
            name="password"
            required
          />
          <input
            className="px-3 py-2 rounded-md hover:bg-zinc-400 bg-zinc-600 border-2 border-zinc-800 outline-none"
            type="number"
            placeholder="age"
            name="age"
            required
          />
          <button
            className="px-5 py-2 rounded-md bg-blue-500 text-white font-bold"
            type="submit"
          >
            Create User
          </button>

          <button
            className="px-5 py-2 rounded-md bg-green-500 text-white font-bold"
            type="button"
            onClick={() => navigate(`/login`)}
          >
            Already a user? Login
          </button>

          {message && <p className="text-center mt-2">{message}</p>}
        </form>
      </div>
    </div>
  )
}

export default Register
