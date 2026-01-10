import React from "react";

import LOGO from "../assets/images/logo.svg";
import ProfileInfo from "./Cards/ProfileInfo";
import { useNavigate } from "react-router-dom";
import SearchBar from "./Input/SearchBar";
import { MdPersonSearch } from "react-icons/md";
import { FaHome } from "react-icons/fa";

const Navbar = ({ userInfo, searchQuery, setSearchQuery, onSearchNote, handleClearSearch }) => {
  const isToken = localStorage.getItem("token");
  const navigate = useNavigate();

  const onLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSearch = () => {
    if (searchQuery) {
      onSearchNote(searchQuery);
    }
  };

  const onClearSearch = () => {
    handleClearSearch();
    setSearchQuery("");
  };

  const handleFindPeople = () => {
    navigate("/find-people");
  };

  return (
    <div className="bg-white flex items-center justify-between px-6 py-2 drop-shadow sticky top-0 z-10">
      <img src={LOGO} alt="travel story" className="h-9" />

      {isToken && (
        <>
          <SearchBar
            value={searchQuery}
            onChange={({ target }) => {
              setSearchQuery(target.value);
            }}
            handleSearch={handleSearch}
            onClearSearch={onClearSearch}
          />
          <button onClick={() => navigate('/dashboard')} className="ml-2 p-2 rounded hover:bg-slate-100">
            <FaHome />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded border-2 border-white text-white bg-cyan-600 hover:bg-cyan-700 transition-colors"
            onClick={handleFindPeople}
          >
            <MdPersonSearch className="text-lg" />
            Find People
          </button>
          <div onClick={() => navigate('/profile')} className="cursor-pointer">
            <ProfileInfo userInfo={userInfo} onLogout={onLogout} />
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;
