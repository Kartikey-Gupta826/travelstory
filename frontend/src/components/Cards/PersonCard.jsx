import React, { useState } from "react";
import { getInitials } from "../../utils/helper";
import { GrMapLocation } from "react-icons/gr";
import moment from "moment";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";

const PersonCard = ({
  userInfo,
  commonInterests,
  commonStory,
  onClick,
  showCommonInterests = true,
}) => {
  const [requestSent, setRequestSent] = useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log("PersonCard props:", { userInfo, commonStory, imageUrl: commonStory?.imageUrl });
  }, [userInfo, commonStory]);

  const handleSendRequest = async (e) => {
    e.stopPropagation();
    if (requestSent) return;
    try {
      await axiosInstance.post("/friend-request", { toUserId: userInfo?._id });
      setRequestSent(true);
      toast.success("Friend Request Sent");
    } catch (err) {
      console.error("Failed to send friend request", err);
      toast.error("Failed to send friend request");
    }
  };
  return (
    <div className="border rounded-lg overflow-hidden bg-white hover:shadow-lg hover:shadow-slate-200 transition-all ease-in-out cursor-pointer">
      <div className="h-48 overflow-hidden bg-slate-200">
        <img
          src={commonStory?.imageUrl || userInfo?.avatar || "/assets/placeholder.png"}
          alt="last-travel"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4" onClick={onClick}>
        <div className="text-center mb-3">
          <h6 className="text-base font-semibold text-slate-900">
            {userInfo?.fullName}
          </h6>
          <p className="text-xs text-slate-500">{userInfo?.email}</p>
        </div>

        <div className="text-center mb-3">
          <button
            onClick={handleSendRequest}
            className={`px-3 py-1 rounded text-sm ${requestSent ? "bg-slate-200 text-slate-600" : "bg-cyan-600 text-white"}`}
          >
            {requestSent ? "Request Sent" : "Send Friend Request"}
          </button>
        </div>

        {showCommonInterests && commonInterests && commonInterests.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-slate-600 mb-2">
              Same Trips:
            </p>
            <div className="flex flex-wrap gap-2">
              {commonInterests.map((interest, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 text-xs text-cyan-600 bg-cyan-200/40 px-2 py-1 rounded"
                >
                  <GrMapLocation className="text-xs" />
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {commonStory && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-600 text-center">
              <span className="font-medium">Similar Story:</span> {commonStory?.title}
            </p>
            <p className="text-xs text-slate-500 text-center mt-1">
              {moment(commonStory?.visitedDate).format("Do MMM YYYY")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonCard;
