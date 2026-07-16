import { useContext } from "react";
import { SocketContext } from "../context/SocketContextObj";

export function useSocket() {
  return useContext(SocketContext);
}
