import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";

const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/notifications");
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleClear = async () => {
    if (!confirm("Clear all notifications?")) return;
    try {
      await axiosInstance.delete("/notifications/clear");
      setNotifications([]);
      toast.success("Notifications Cleared");
    } catch (err) {
      console.error("Failed to clear notifications", err);
      toast.error("Failed to clear notifications");
    }
  };

  const handleRespond = async (notificationId, accept) => {
    try {
      await axiosInstance.post("/friend-request/respond", { notificationId, accept });
      // refresh notifications
      fetchNotifications();
      // notify friends box to refresh
      window.dispatchEvent(new Event("friendsUpdated"));
      toast.success(accept ? "Friend Request Accepted" : "Friend Request Declined");
    } catch (err) {
      console.error("Respond failed", err);
      toast.error("Failed to respond to request");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <button className="text-sm text-slate-500" onClick={handleClear}>Clear</button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-sm text-slate-500">No notifications</div>
        ) : (
          notifications.map((n) => (
            <div key={n._id} className="text-sm">
              <div className="font-medium text-slate-900">{n.title}</div>
              <div className="text-xs text-slate-500">{new Date(n.createdOn).toLocaleString()}</div>
              {(
                n.type === "friend_request" ||
                /friend request/i.test(n.title || "") ||
                /friend request/i.test(n.message || "") ||
                (n.meta && n.meta.fromUserId)
              ) && (
                <div className="mt-2 flex gap-2">
                  <button onClick={() => handleRespond(n._id, true)} className="px-3 py-1 text-sm bg-cyan-600 text-white rounded">Accept</button>
                  <button onClick={() => handleRespond(n._id, false)} className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded">Reject</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
