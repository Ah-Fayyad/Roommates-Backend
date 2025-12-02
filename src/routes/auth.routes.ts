import express from "express";
import { signup, login } from "../controllers/auth.controller";
import {
  forgotPassword,
  resetPassword,
  verifyResetToken,
} from "../controllers/password.controller";
import { body, validationResult } from "express-validator";

const handleValidationErrors = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((err: any) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

const router = express.Router();

router.post(
  "/signup",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("role")
      .optional()
      .isIn(["USER", "LANDLORD"])
      .withMessage("Invalid role"),
  ],
  handleValidationErrors,
  signup
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  handleValidationErrors,
  login
);

// Password Reset Routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-token/:token", verifyResetToken);

export default router;
