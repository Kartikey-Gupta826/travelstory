import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import PersonCard from "../../components/Cards/PersonCard";
import EmptyCard from "../../components/Cards/EmptyCard";
import GroupsSidebar from "../../components/Sidebar/GroupsSidebar";
import FriendsBox from "../../components/Sidebar/FriendsBox";
import NotificationsPanel from "../../components/Notifications/NotificationsPanel";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import ADD_STORY_IMG from "../../assets/images/add-story.svg";

const FindPeople = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [peopleWithSimilarInterests, setPeopleWithSimilarInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [emailSearch, setEmailSearch] = useState("");

  // Get current user info
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
      console.error("Error fetching user info:", error);
    }
  };

  // Get people with similar interests (recommendations)
  const getPeopleWithSimilarInterests = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/recommendations?limit=10&skip=0");
      if (response.data && response.data.recommendations) {
        setPeopleWithSimilarInterests(response.data.recommendations);
      }
    } catch (error) {
      console.error("Error fetching people with similar interests:", error);
      setPeopleWithSimilarInterests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByEmail = async () => {
    if (!emailSearch) return getPeopleWithSimilarInterests();
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/find-person?email=${encodeURIComponent(emailSearch)}`);
      if (res.data && res.data.person) {
        setPeopleWithSimilarInterests([res.data.person]);
      } else {
        setPeopleWithSimilarInterests([]);
      }
    } catch (err) {
      console.error("Find person failed", err);
      setPeopleWithSimilarInterests([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter people based on search query
  const filteredPeople = peopleWithSimilarInterests.filter((person) =>
    person.userInfo?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.commonInterests?.some((interest) =>
      interest.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handlePersonClick = (person) => {
    // Can be extended to show more details or connect with the person
    console.log("Clicked on person:", person);
  };

  useEffect(() => {
    getUserInfo();
    getPeopleWithSimilarInterests();
  }, []);

  return (
    <div>
      <Navbar
        userInfo={userInfo}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-6">
          <div className="w-64 hidden lg:block">
            <GroupsSidebar />
            <FriendsBox />
          </div>

          <main className="flex-1">
            <div className="mb-4 flex items-center gap-3">
              <input
                placeholder="Search by email"
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                className="px-3 py-2 border rounded w-full lg:w-1/3"
              />
              <button onClick={handleSearchByEmail} className="px-3 py-2 bg-cyan-600 text-white rounded">Search</button>
            </div>

            <div className="mb-7">
              <h1 className="text-2xl font-semibold text-slate-900">
                People with Similar Interests
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                Discover travelers who share your interests and travel experiences
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-slate-500">Loading...</p>
              </div>
            ) : filteredPeople.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPeople.map((person) => (
                  <PersonCard
                    key={person.userInfo._id}
                    userInfo={person.userInfo}
                    commonInterests={person.commonInterests}
                    commonStory={person.commonStory}
                    onClick={() => handlePersonClick(person)}
                    showCommonInterests={emailSearch === ""}
                  />
                ))}
              </div>
            ) : (
              <EmptyCard
                imgSrc={ADD_STORY_IMG}
                message={
                  searchQuery
                    ? "No people found matching your search."
                    : "No people with similar interests found yet. Start creating travel stories to find your match!"
                }
              />
            )}
          </main>

          <aside className="w-80 hidden lg:block">
            <NotificationsPanel />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default FindPeople;
