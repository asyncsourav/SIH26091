import { Router } from "express";
import * as calculatorController from "../controllers/calculator.controller.js";

export const calculatorRouter = Router();
calculatorRouter.post("/compute", calculatorController.computeBreakdown);
