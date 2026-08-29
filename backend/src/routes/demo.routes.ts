import { Router } from "express";
import * as demoController from "../controllers/demo.controller.js";

export const demoRouter = Router();
demoRouter.get("/sunita", demoController.getSunitaDemo);
