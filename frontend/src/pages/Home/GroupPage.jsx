import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";

const GroupPage = () => {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [message, setMessage] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDelete1, setShowDelete1] = useState(false);
  const [showDelete2, setShowDelete2] = useState(false);
  const [showBgUpload, setShowBgUpload] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);
  const [bgSelectedFile, setBgSelectedFile] = useState(null);
  const bgInputRef = React.useRef(null);
  const navigate = useNavigate();

  const fetchGroup = async () => {
    try {
      const res = await axiosInstance.get(`/groups/${id}`);
      setGroup(res.data.group);
    } catch (err) {
      console.error("Failed to fetch group", err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await axiosInstance.get(`/groups/${id}/announcements`);
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    }
  };

  useEffect(() => {
    fetchGroup();
    fetchAnnouncements();
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get('/get-user');
        setCurrentUser(res.data.user);
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    };
    fetchUser();
  }, [id]);

  const postAnnouncement = async () => {
    if (!message) return;
    try {
      await axiosInstance.post(`/groups/${id}/announcements`, { message });
      setMessage("");
      fetchAnnouncements();
      toast.success("Announcement Posted");
    } catch (err) {
      console.error("Failed to post announcement", err);
      toast.error("Failed to post announcement");
    }
  };

  const handleBgImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    setBgSelectedFile(file.name);
    setBgUploading(true);
    
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axiosInstance.post("/image-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      const { imageUrl } = res.data;
      
      // Update group background
      const bgRes = await axiosInstance.post(`/groups/${id}/background`, { backgroundImageUrl: imageUrl });
      
      await fetchGroup();
      
      toast.success("Background Updated");
      
      // Reset form and close modal
      if (bgInputRef.current) {
        bgInputRef.current.value = "";
      }
      setBgSelectedFile(null);
      setShowBgUpload(false);
    } catch (err) {
      console.error("Full error object:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error message:", err.message);
      toast.error("Failed: " + (err.response?.data?.message || err.message));
    } finally {
      setBgUploading(false);
    }
  };

  return (
    <>
    <div 
      className="min-h-screen py-8 px-6"
      style={{
        backgroundImage: group?.backgroundImageUrl ? `url(${group.backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto">
          {/* Header Section */}
          <div className="soft-container p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">{group?.name || "Group"}</h2>
            <p className="text-sm text-slate-600 mb-4">{group?.description}</p>

            <div className="flex items-center justify-between">
              <button onClick={() => setShowMembers((s) => !s)} className="px-3 py-1 bg-slate-100 rounded">{showMembers ? "Hide Members" : "Show Members"}</button>

              <div className="flex items-center gap-2">
                {/* Creator controls */}
                {currentUser && group?.createdBy && String(currentUser._id) === String(group.createdBy._id) ? (
                  <>
                    <button onClick={() => setShowBgUpload(true)} className="px-3 py-1 bg-cyan-600 text-white rounded">Set Background</button>
                    <button onClick={() => setShowDelete1(true)} className="px-3 py-1 bg-red-600 text-white rounded">Delete Group</button>
                  </>
                ) : (
                  /* Non-creator members: show Leave button in header */
                  currentUser && group?.members && group.members.some(m => String(m._id) === String(currentUser._id)) && String(currentUser._id) !== String(group?.createdBy?._id) ? (
                    <button onClick={async () => {
                      if (!confirm("Are you sure you want to leave this group?")) return;
                      try {
                        await axiosInstance.post(`/groups/${id}/leave`);
                        toast.success("Left Group");
                        navigate('/dashboard');
                      } catch (err) {
                        console.error("Leave group error:", err);
                        toast.error("Failed to leave group: " + (err.response?.data?.message || err.message));
                      }
                    }} className="px-3 py-1 bg-orange-600 text-white rounded">Leave Group</button>
                  ) : null
                )}
              </div>
            </div>
          </div>

          {/* Members Section */}
          {showMembers && (
            <div className="soft-container p-6 mb-6">
              <h4 className="font-semibold mb-4">Members</h4>
              <div className="space-y-3">
            {group?.members?.map((m) => (
              <div key={m._id} className="py-2 border-b flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.fullName}</div>
                  <div className="text-xs text-slate-500">{m.email}</div>
                </div>
                {currentUser && group?.createdBy && String(currentUser._id) === String(group.createdBy._id) && String(currentUser._id) !== String(m._id) && (
                  <button onClick={async () => {
                    try {
                      await axiosInstance.post(`/groups/${id}/remove-member`, { memberId: m._id });
                      toast.success("Member Removed");
                      fetchGroup();
                    } catch (err) {
                      console.error("Remove member error:", err);
                      toast.error("Failed to remove member: " + (err.response?.data?.message || err.message));
                    }
                  }} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Remove</button>
                )}
              </div>
            ))}
              </div>
            </div>
          )}

          {/* Announcements Section */}
          <div className="soft-container p-6 mb-6">
            <h4 className="font-semibold mb-4">Announcements</h4>
            
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full border p-2 rounded mb-3" placeholder="Write an announcement"></textarea>
            <div className="text-right mb-6">
              <button onClick={postAnnouncement} className="px-3 py-1 bg-cyan-600 text-white rounded">Post</button>
            </div>

            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a._id} className="soft-container p-3 border rounded">
                  <div className="font-medium">{a.userId?.fullName}</div>
                  <div className="text-xs text-slate-500">{new Date(a.createdOn).toLocaleString()}</div>
                  <div className="mt-2">{a.message}</div>
                </div>
              ))}
              {announcements.length === 0 && <div className="text-sm text-slate-600">No announcements</div>}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Delete Confirmation Modals */}
    {showDelete1 && (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow max-w-md w-full">
          <h3 className="text-lg font-semibold mb-3">Are you sure?</h3>
          <p className="text-sm text-slate-600 mb-4">Deleting the group will remove it and all announcements. This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowDelete1(false)} className="px-3 py-1 border rounded">Cancel</button>
            <button onClick={() => { setShowDelete1(false); setShowDelete2(true); }} className="px-3 py-1 bg-red-600 text-white rounded">Yes, delete</button>
          </div>
        </div>
      </div>
    )}

    {showDelete2 && (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow max-w-md w-full">
          <h3 className="text-lg font-semibold mb-3">Confirm deletion</h3>
          <p className="text-sm text-slate-600 mb-4">This is the final confirmation. Click Confirm to permanently delete the group.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowDelete2(false)} className="px-3 py-1 border rounded">Cancel</button>
            <button onClick={async () => {
              try {
                await axiosInstance.delete(`/groups/${id}`);
                toast.success('Group Deleted');
                navigate('/dashboard');
              } catch (err) {
                console.error('Failed to delete group', err);
                toast.error('Failed to delete group');
              }
            }} className="px-3 py-1 bg-red-600 text-white rounded">Confirm</button>
          </div>
        </div>
      </div>
    )}

    {/* Background Image Upload Modal */}
    {showBgUpload && (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Set Group Background</h3>
          
          {/* Hidden file input */}
          <input 
            ref={bgInputRef}
            type="file" 
            accept="image/*"
            onChange={handleBgImageUpload}
            disabled={bgUploading}
            style={{ display: 'none' }}
          />
          
          {/* Upload button */}
          <button 
            onClick={() => {
              bgInputRef.current?.click();
            }}
            disabled={bgUploading}
            className="w-full px-4 py-2 bg-cyan-600 text-white rounded mb-4 disabled:opacity-50"
          >
            {bgUploading ? "Uploading..." : "Choose Image"}
          </button>
          
          {/* Show selected file */}
          {bgSelectedFile && (
            <p className="text-sm text-slate-600 mb-4">Selected: {bgSelectedFile}</p>
          )}
          
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => {
                setShowBgUpload(false);
                if (bgInputRef.current) {
                  bgInputRef.current.value = "";
                }
                setBgSelectedFile(null);
              }} 
              disabled={bgUploading}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Delete Group Button - REMOVED - now in header */}

    {/* Leave Group Button removed (now in header) */}

    {/* Delete Confirmation Modal 1 */}
    {showDelete1 && (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow max-w-md w-full">
          <h3 className="text-lg font-semibold mb-3">Are you sure?</h3>
          <p className="text-sm text-slate-600 mb-4">Deleting the group will remove it and all announcements. This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowDelete1(false)} className="px-3 py-1 border rounded">Cancel</button>
            <button onClick={() => { setShowDelete1(false); setShowDelete2(true); }} className="px-3 py-1 bg-red-600 text-white rounded">Yes, delete</button>
          </div>
        </div>
      </div>
    )}

    {/* Delete Confirmation Modal 2 */}
    {showDelete2 && (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow max-w-md w-full">
          <h3 className="text-lg font-semibold mb-3">Confirm deletion</h3>
          <p className="text-sm text-slate-600 mb-4">This is the final confirmation. Click Confirm to permanently delete the group.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowDelete2(false)} className="px-3 py-1 border rounded">Cancel</button>
            <button onClick={async () => {
              try {
                await axiosInstance.delete(`/groups/${id}`);
                toast.success('Group Deleted');
                navigate('/dashboard');
              } catch (err) {
                console.error('Failed to delete group', err);
                toast.error('Failed to delete group');
              }
            }} className="px-3 py-1 bg-red-600 text-white rounded">Confirm</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default GroupPage;
