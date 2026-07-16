import { describe, it, expect, vi } from "vitest";
import authMiddleware from "../middleware/auth";
import jwt from "jsonwebtoken";

describe("Auth Middleware", () => {
  it("should deny access if no Authorization header is present", () => {
    const req = { headers: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No token, authorization denied" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should deny access if Authorization header does not start with Bearer", () => {
    const req = { headers: { authorization: "Basic logindetails" } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No token, authorization denied" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next() and populate req.userId if JWT is valid", () => {
    const secret = "testsecret";
    process.env.JWT_SECRET = secret;
    const token = jwt.sign({ id: "user123" }, secret);

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(req.userId).toBe("user123");
    expect(next).toHaveBeenCalled();
  });

  it("should deny access if JWT is invalid", () => {
    process.env.JWT_SECRET = "testsecret";
    const req = { headers: { authorization: "Bearer invalidtoken" } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });
});
