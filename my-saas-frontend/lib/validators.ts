import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string({
      required_error: "Full name is required",
    })
    .min(3, "Full name must be at least 3 characters long"),
  username: z
    .string({
      required_error: "Username is required",
    })
    .min(3, "Username must contain at least 3 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers or _"
    ),
  email: z
    .string({
      required_error: "Email is required",
    })
    .email("Enter a valid email address"),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(8, "Password must be at least 8 characters long"),
  // role and inviteCode removed — public signup will always create Developer
});

export const loginSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
    })
    .email("Enter a valid email address"),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(1, "Password is required"),
});