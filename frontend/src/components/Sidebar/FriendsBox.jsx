import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";

const FriendsBox = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInviteFor, setShowInviteFor] = useState(null); // friend id for which invite UI shown
  const [myCreatedGroups, setMyCreatedGroups] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/friends");
      setFriends(res.data.friends || []);
    } catch (err) {
      console.error("Failed to fetch friends", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    try {
      const res = await axiosInstance.get("/groups/created");
      setMyCreatedGroups(res.data.groups || []);
    } catch (err) {
      console.error("Failed to fetch my groups", err);
    }
  };

  useEffect(() => {
    fetchFriends();
    const handler = () => fetchFriends();
    window.addEventListener("friendsUpdated", handler);
    return () => window.removeEventListener("friendsUpdated", handler);
  }, []);

  useEffect(() => {
    fetchMyGroups();
  }, []);

  const handleInvite = async (friendId, groupId) => {
    setInviteLoading(true);
    try {
      await axiosInstance.post(`/groups/${groupId}/invite`, { toUserId: friendId });
      toast.success("Invite Sent");
      setShowInviteFor(null);
    } catch (err) {
      console.error("Invite failed", err);
      toast.error("Failed to send invite");
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Friends</h3>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : friends.length === 0 ? (
          <div className="text-sm text-slate-500">No friends yet</div>
        ) : (
          friends.map((f) => (
            <div key={f.userInfo._id} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 overflow-hidden rounded">
                <img src={f.lastStory?.imageUrl || "/assets/placeholder.png"} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{f.userInfo.fullName}</div>
                <div className="text-xs text-slate-500">{f.userInfo.email}</div>
              </div>
              <div>
                <button
                  onClick={() => {
                    if (!myCreatedGroups || myCreatedGroups.length === 0) {
                      toast.info("You have not created any groups yet.");
                      return;
                    }
                    setShowInviteFor(f.userInfo._id);
                  }}
                  className="px-3 py-2 bg-cyan-600 text-white rounded"
                >
                  Invite
                </button>
              </div>

              {showInviteFor === f.userInfo._id && (
                <>
                  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white p-5 rounded shadow max-w-sm w-full">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-sm text-slate-500">Invite</div>
                          <div className="font-medium">Invite {f.userInfo.fullName} to a group</div>
                        </div>
                        <button onClick={() => setShowInviteFor(null)} className="text-slate-500">Close</button>
                      </div>

                      <div className="space-y-2">
                        {myCreatedGroups.map((g) => (
                          <button key={g._id} onClick={() => handleInvite(f.userInfo._id, g._id)} disabled={inviteLoading} className="w-full text-left px-3 py-2 border rounded hover:bg-slate-50">
                            {g.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FriendsBox;
