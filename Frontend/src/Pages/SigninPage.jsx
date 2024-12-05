import React, { useState } from "react";
import { User, KeyRound } from "lucide-react";
import backgroundImage from "../assets/Best-Beginner-Road-Bikes-gear-patrol-full-lead.jpg";

export default function SigninPage() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex justify-center items-center h-screen bg-cover bg-center "
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="w-[420px] bg-neutral-200 border-white/40 text-neutral-900 rounded-2xl py-24 px-10">
        <form action="">
          <h1 className="text-3xl text-center">Login</h1>
          <div className="relative w-full h-12 my-7">
            <input
              type="text"
              placeholder="Username"
              required
              className="w-full h-full bg-transparent border-2 border-black/20 outline-none rounded-full text-base text-neutral-900 p-5 pr-12"
            />
            <User className="absolute right-5 top-1/2 transform -translate-y-1/2 text-base" />
          </div>
          <div className="relative w-full h-12 my-7">
            <input
              type="password"
              placeholder="Password"
              required
              className="w-full h-full bg-transparent border-2 border-black/20 outline-none rounded-full text-base text-neutral-900 p-5 pr-12"
            />
            <KeyRound className="absolute right-5 top-1/2 transform -translate-y-1/2 text-base" />
          </div>

          <div className="flex justify-between text-sm mb-3 mt-[-15px]">
            <label className="flex items-center">
              <input type="checkbox" className="accent-neutral-900 mr-1" />
              Remember me
            </label>
            <a href="#" className="text-neutral-900 hover:underline">
              Forgot Password?
            </a>
          </div>
          <button
            type="submit"
            className={`w-full h-12 rounded-full text-base cursor-pointer shadow-md font-bold ${
              isHovered
                ? "bg-primary-600 text-neutral-900"
                : "bg-white text-neutral-900"
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            Login
          </button>
          <div className="text-sm text-center mt-5">
            <p>Please Contact Admin if you don't have an account!</p>
          </div>
        </form>
      </div>
    </div>
  );
}
