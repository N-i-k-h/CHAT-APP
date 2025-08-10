import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const LoginPage = () => {
  const [currState, setCurrState] = useState("sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (currState === "sign up" && !isDataSubmitted) {
      if (!fullName || !email || !password) {
        toast.error("Please fill all required fields");
        return;
      }
      setIsDataSubmitted(true);
      return;
    }

    const payload =
      currState === "sign up"
        ? { fullName, email, password, bio }
        : { email, password };

    const success = await login(
      currState === "sign up" ? "signup" : "login",
      payload
    );

    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 sm:px-0">
      {/* Left Side */}
      <div className="flex-1 hidden sm:flex flex-col items-center justify-center">
        <img src={assets.logo_big} alt="QuickChat Logo" className="w-[min(250px,30vw)] mb-4" />
        <h1 className="text-4xl font-bold">QuickChat</h1>
      </div>

      {/* Right Side - Form */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-gray-500 rounded-xl p-8 flex flex-col gap-5 shadow-lg"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold capitalize">{currState}</h2>
          <img
            src={assets.arrow_icon}
            alt="Switch"
            className="w-5 cursor-pointer"
            onClick={() => {
              setCurrState(currState === "sign up" ? "login" : "sign up");
              setIsDataSubmitted(false);
            }}
          />
        </div>

        {/* Step 1 */}
        {currState === "sign up" && !isDataSubmitted && (
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="p-3 rounded-md bg-transparent border border-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        )}

        {/* Common Inputs */}
        {!isDataSubmitted && (
          <>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 rounded-md bg-transparent border border-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 rounded-md bg-transparent border border-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </>
        )}

        {/* Step 2: Bio */}
        {currState === "sign up" && isDataSubmitted && (
          <textarea
            rows={4}
            placeholder="Provide a short bio..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="p-3 rounded-md bg-transparent border border-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            required
          />
        )}

        <button
          type="submit"
          className="py-3 rounded-md bg-gradient-to-r from-purple-500 to-violet-600 font-medium hover:opacity-90 transition"
        >
          {currState === "sign up"
            ? isDataSubmitted
              ? "Create Account"
              : "Next"
            : "Login Now"}
        </button>

        <div className="flex items-start gap-2 text-sm text-gray-300">
          <input type="checkbox" required className="mt-1" />
          <p>Agree to the terms of use & privacy policy.</p>
        </div>

        <div className="text-sm text-gray-400 text-center">
          {currState === "sign up" ? (
            <>
              Already have an account?{" "}
              <span
                onClick={() => {
                  setCurrState("login");
                  setIsDataSubmitted(false);
                }}
                className="text-violet-400 font-semibold cursor-pointer"
              >
                Login here
              </span>
            </>
          ) : (
            <>
              Create an account?{" "}
              <span
                onClick={() => {
                  setCurrState("sign up");
                  setIsDataSubmitted(false);
                }}
                className="text-violet-400 font-semibold cursor-pointer"
              >
                Click here
              </span>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginPage;