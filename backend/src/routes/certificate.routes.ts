import express from "express";
import { downloadCertificate } from "../controllers/certificate.controller";

const router = express.Router();
router.get("/:certificateId/download", downloadCertificate);

export default router;