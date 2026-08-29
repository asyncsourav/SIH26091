import { Router } from "express";
import * as partnerController from "../controllers/partner.controller.js";

export const partnerRouter = Router();

partnerRouter.get("/incoming", ...partnerController.listIncomingApplications);
partnerRouter.patch("/routings/:id", ...partnerController.decideRouting);
