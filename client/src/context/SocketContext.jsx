import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config/api";
import { SocketContext } from "./SocketContextObj";


export function SocketProvider({ children }) {

  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user || !token) return;

    const newSocket = io(API_BASE, {
      auth: { token }
    });

    newSocket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

