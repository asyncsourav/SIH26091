import { Router } from "express";
import * as applicationController from "../controllers/application.controller.js";
import * as reportController from "../controllers/report.controller.js";
import * as partnerController from "../controllers/partner.controller.js";

export const applicationRouter = Router();

applicationRouter.post("/", ...applicationController.createApplication);
applicationRouter.get("/mine", ...applicationController.listMyApplications);
applicationRouter.get("/:id", ...applicationController.getApplication);

applicationRouter.post("/:applicationId/report", ...reportController.generateReport);
applicationRouter.get("/:applicationId/report", ...reportController.getReport);

applicationRouter.post("/:applicationId/route", ...partnerController.routeApplicationToPartners);
