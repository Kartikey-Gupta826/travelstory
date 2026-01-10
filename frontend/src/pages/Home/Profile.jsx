import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await axiosInstance.get("/get-user");
      setUser(res.data.user);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        // Unauthorized - clear storage and redirect to login
        localStorage.clear();
        navigate("/login");
      } else {
        console.error("Failed to fetch user", err);
      }
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        {user ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-slate-600">Name</label>
              <div className="mt-1 text-base font-medium">{user.fullName}</div>
            </div>

            <div>
              <label className="text-sm text-slate-600">Email</label>
              <div className="mt-1 text-base font-medium">{user.email}</div>
            </div>

            <div>
              <label className="text-sm text-slate-600">Password</label>
              <div className="mt-1 flex items-center gap-3">
                <input readOnly value={showPassword ? "your-password" : "********"} className="px-3 py-2 border rounded w-full" />
                <button onClick={() => setShowPassword((s) => !s)} className="px-3 py-2 bg-slate-100 rounded">{showPassword ? "Hide" : "Show"}</button>
              </div>
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </div>
  );
};

export default Profile;
