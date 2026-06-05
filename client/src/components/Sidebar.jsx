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
    if (!groupName.trim() || selectedMembers.length === 0) return;
    try {
      const res = await axios.post(
        "http://localhost:5000/api/groups",
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
    <div className="w-80 bg-[#13102e] border-r border-white/5 flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            TalkFlow
          </h1>
          <button
            id="logout-btn"
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
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
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-9 h-9 rounded-full bg-gradient-to-br ${getColor(currentUser?.id)} flex items-center justify-center text-white text-sm font-semibold`}
          >
            {getInitial(currentUser?.name)}
          </div>
          <div>
            <p className="text-white text-sm font-medium">
              {currentUser?.name}
            </p>
            <p className="text-green-400 text-xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
              Online
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
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
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setTab("users")}
          className={`flex-1 py-3 text-sm font-medium transition-all cursor-pointer ${
            tab === "users"
              ? "text-violet-400 border-b-2 border-violet-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setTab("groups")}
          className={`flex-1 py-3 text-sm font-medium transition-all cursor-pointer ${
            tab === "groups"
              ? "text-violet-400 border-b-2 border-violet-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Groups
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {tab === "users" ? (
          <div className="p-2">
            {filteredUsers.map((u) => (
              <button
                key={u._id}
                onClick={() => onSelectUser(u)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                  selectedChat?._id === u._id && chatType === "user"
                    ? "bg-violet-600/20 border border-violet-500/30"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${getColor(u._id)} flex items-center justify-center text-white text-sm font-semibold`}
                  >
                    {getInitial(u.name)}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#13102e] ${
                      onlineUsers.includes(u._id)
                        ? "bg-green-400"
                        : "bg-gray-500"
                    }`}
                  ></span>
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">{u.name}</p>
                  <p
                    className={`text-xs ${onlineUsers.includes(u._id) ? "text-green-400" : "text-gray-500"}`}
                  >
                    {onlineUsers.includes(u._id) ? "Online" : "Offline"}
                  </p>
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">
                No users found
              </p>
            )}
          </div>
        ) : (
          <div className="p-2">
            {/* Create group button */}
            <button
              onClick={() => setShowCreateGroup(!showCreateGroup)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all mb-1 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white">
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <p className="text-violet-400 text-sm font-medium">
                Create Group
              </p>
            </button>

            {/* Create group form */}
            {showCreateGroup && (
              <div className="mx-2 mb-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 mb-3"
                />
                <p className="text-gray-400 text-xs mb-2">Select members:</p>
                <div className="max-h-32 overflow-y-auto space-y-1 mb-3">
                  {users.map((u) => (
                    <label
                      key={u._id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(u._id)}
                        onChange={() => toggleMember(u._id)}
                        className="accent-violet-500"
                      />
                      <span className="text-white text-sm">{u.name}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={createGroup}
                  className="w-full py-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-violet-500 hover:to-cyan-500 transition-all cursor-pointer"
                >
                  Create
                </button>
              </div>
            )}

            {/* Group list */}
            {filteredGroups.map((g) => (
              <button
                key={g._id}
                onClick={() => onSelectGroup(g)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                  selectedChat?._id === g._id && chatType === "group"
                    ? "bg-violet-600/20 border border-violet-500/30"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${getColor(g._id)} flex items-center justify-center text-white text-sm font-semibold`}
                >
                  {getInitial(g.name)}
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">{g.name}</p>
                  <p className="text-gray-500 text-xs">
                    {g.members?.length || 0} members
                  </p>
                </div>
              </button>
            ))}
            {filteredGroups.length === 0 && !showCreateGroup && (
              <p className="text-gray-500 text-sm text-center py-8">
                No groups yet
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
