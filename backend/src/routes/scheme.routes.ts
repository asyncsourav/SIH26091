import { Router } from "express";
import * as schemeController from "../controllers/scheme.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

export const schemeRouter = Router();

schemeRouter.get("/", schemeController.listSchemes);
schemeRouter.post("/", requireAuth, requireRole("ADMIN"), schemeController.createScheme);
schemeRouter.patch("/:id", requireAuth, requireRole("ADMIN"), schemeController.updateScheme);
schemeRouter.delete("/:id", requireAuth, requireRole("ADMIN"), schemeController.deleteScheme);
