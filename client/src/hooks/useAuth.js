import { useContext } from "react";
import { AuthContext } from "../context/AuthContextObj";

export function useAuth() {
  return useContext(AuthContext);
}
