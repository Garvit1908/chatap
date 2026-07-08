import { useState } from "react";
import axios from "axios";

export default function Sidebar({
  users,
  groups,
  onlineUsers,
  selectedChat,
  chatType,
  onSelectUser,
  onSelectGroup,
  onGroupCreated,
  currentUser,
  token,
  onLogout,
}) {
  const [tab, setTab] = useState("users");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [groupError, setGroupError] = useState("");

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim() && selectedMembers.length === 0) {
      setGroupError("Please enter a group name and select members");
      return;
    }
    if (!groupName.trim()) {
      setGroupError("Please enter a group name");
      return;
    }
    if (selectedMembers.length === 0) {
      setGroupError("Please select at least one member");
      return;
    }
    setGroupError("");
    try {
      const res = await axios.post(
        "https://talkflow-backend-k286.onrender.com/api/groups",
        { name: groupName, members: selectedMembers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onGroupCreated(res.data);
      setShowCreateGroup(false);
      setGroupName("");
      setSelectedMembers([]);
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || "?";

  const avatarColors = [
    "from-violet-500 to-purple-600",
    "from-cyan-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-pink-500 to-rose-600",
    "from-indigo-500 to-blue-600",
  ];

  const getColor = (id) => {
    const index =
      id?.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
      avatarColors.length;
    return avatarColors[index || 0];
  };

  return (
    <div className="w-full md:w-80 bg-gradient-to-b from-[#13102e] to-[#0f0c29] border-r border-white/10 flex flex-col h-full shadow-2xl relative z-20">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-white/[0.02] backdrop-blur-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-md">
            TalkFlow
          </h1>
          <button
            id="logout-btn"
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-full transition-all duration-300 hover:rotate-12 cursor-pointer shadow-sm"
            title="Logout"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>

        {/* Current user */}
        <div className="flex items-center gap-4 mb-6 bg-white/5 p-3 rounded-2xl border border-white/10 shadow-inner">
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${getColor(currentUser?.id)} flex items-center justify-center text-white text-sm font-semibold shadow-lg ring-2 ring-white/20`}
          >
            {getInitial(currentUser?.name)}
          </div>
          <div>
            <p className="text-white text-sm font-semibold tracking-wide">
              {currentUser?.name}
            </p>
            <p className="text-emerald-400 text-xs flex items-center gap-1.5 font-medium mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Online
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-cyan-400 transition-colors duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="sidebar-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-full text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 shadow-inner"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-2 gap-1 bg-black/10">
        <button
          onClick={() => setTab("users")}
          className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-300 rounded-lg cursor-pointer ${
            tab === "users"
              ? "bg-white/10 text-white shadow-md ring-1 ring-white/20"
              : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setTab("groups")}
          className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-300 rounded-lg cursor-pointer ${
            tab === "groups"
              ? "bg-white/10 text-white shadow-md ring-1 ring-white/20"
              : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
          }`}
        >
          Groups
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-3 px-2 space-y-1">
        {tab === "users" ? (
          <>
            {filteredUsers.map((u) => (
              <button
                key={u._id}
                onClick={() => onSelectUser(u)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group ${
                  selectedChat?._id === u._id && chatType === "user"
                    ? "bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 border border-violet-500/50 shadow-lg shadow-violet-500/10"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="relative">
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-br ${getColor(u._id)} flex items-center justify-center text-white text-sm font-bold shadow-md group-hover:shadow-lg transition-all`}
                  >
                    {getInitial(u.name)}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#13102e] ${
                      onlineUsers.includes(u._id)
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                        : "bg-gray-500"
                    }`}
                  ></span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-gray-100 text-sm font-semibold tracking-wide">{u.name}</p>
                  <p
                    className={`text-xs font-medium mt-0.5 ${onlineUsers.includes(u._id) ? "text-emerald-400" : "text-gray-500"}`}
                  >
                    {onlineUsers.includes(u._id) ? "Active now" : "Offline"}
                  </p>
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 opacity-50">
                <p className="text-gray-400 text-sm font-medium">No users found</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Create group button */}
            <button
              onClick={() => setShowCreateGroup(!showCreateGroup)}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-gradient-to-r hover:from-violet-600/20 hover:to-cyan-600/20 border border-white/5 hover:border-violet-500/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer mb-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-md group-hover:rotate-90 transition-transform duration-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 text-sm font-bold tracking-wide">
                New Group
              </p>
            </button>

            {/* Create group form */}
            {showCreateGroup && (
              <div className="mx-1 mb-4 p-5 bg-white/[0.03] rounded-2xl border border-white/10 backdrop-blur-md shadow-xl animate-in slide-in-from-top-2 duration-300">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group Name..."
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 mb-3 transition-all"
                />
                {groupError && (
                  <p className="text-amber-400 text-xs font-medium mb-3 px-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {groupError}
                  </p>
                )}
                <p className="text-gray-400 text-xs font-semibold mb-3 tracking-wider uppercase">Select Members</p>
                <div className="max-h-40 overflow-y-auto space-y-1.5 mb-4 scrollbar-hide pr-1">
                  {users.map((u) => (
                    <label
                      key={u._id}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group"
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(u._id)}
                          onChange={() => toggleMember(u._id)}
                          className="peer appearance-none w-5 h-5 border-2 border-gray-500 rounded-md checked:bg-violet-500 checked:border-violet-500 transition-all cursor-pointer"
                        />
                        <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">{u.name}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={createGroup}
                  className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-bold rounded-xl hover:from-violet-500 hover:to-cyan-500 transition-all duration-300 shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] cursor-pointer"
                >
                  Create Group
                </button>
              </div>
            )}

            {/* Group list */}
            {filteredGroups.map((g) => (
              <button
                key={g._id}
                onClick={() => onSelectGroup(g)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group ${
                  selectedChat?._id === g._id && chatType === "group"
                    ? "bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 border border-violet-500/50 shadow-lg shadow-violet-500/10"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getColor(g._id)} flex items-center justify-center text-white text-sm font-bold shadow-md transform group-hover:rotate-3 transition-transform`}
                >
                  {getInitial(g.name)}
                </div>
                <div className="text-left flex-1">
                  <p className="text-gray-100 text-sm font-semibold tracking-wide">{g.name}</p>
                  <p className="text-gray-500 text-xs font-medium mt-0.5">
                    {g.members?.length || 0} participants
                  </p>
                </div>
              </button>
            ))}
            {filteredGroups.length === 0 && !showCreateGroup && (
              <div className="flex flex-col items-center justify-center h-32 opacity-50">
                <p className="text-gray-400 text-sm font-medium">No groups yet</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
