import React, { useEffect, useState } from "react";
import { FaPlus, FaUsers } from "react-icons/fa";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

const GroupsSidebar = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/groups");
      setGroups(res.data.groups || []);
    } catch (err) {
      console.error("Failed to fetch groups", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async () => {
    console.log("🔥 CREATE BUTTON CLICKED");
    const name = prompt("Enter group name");
    if (!name) return;
    try {
      await axiosInstance.post("/groups", { name });
      alert("Group created successfully");
      fetchGroups();
    } catch (err) {
      console.error("Create group failed", err);
      alert("Failed to create group");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Groups</h3>
        <button
          onClick={handleCreateGroup}
          className="flex items-center gap-2 px-3 py-1 rounded border-2 border-white text-white bg-cyan-600 hover:bg-cyan-700 transition-colors"
        >
          <FaPlus />
          Create
        </button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : groups.length === 0 ? (
          <div className="text-sm text-slate-500">No groups yet</div>
        ) : (
          groups.map((g) => (
            <div
                key={g._id}
                onClick={() => navigate(`/groups/${g._id}`)}
                className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer"
              >
              <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700">
                <FaUsers />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900">{g.name}</div>
                <div className="text-xs text-slate-500">{(g.members || []).length} members</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupsSidebar;
