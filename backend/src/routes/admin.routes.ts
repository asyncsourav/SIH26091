import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";

export const adminRouter = Router();

adminRouter.get("/duplicate-reviews", ...adminController.listDuplicateReviews);
adminRouter.patch("/duplicate-reviews/:id", ...adminController.decideDuplicateReview);
adminRouter.get("/applications", ...adminController.listAllApplications);
