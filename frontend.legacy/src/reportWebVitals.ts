import type { Metric } from "web-vitals";
import { onCLS, onFID, onFCP, onLCP, onTTFB } from "web-vitals";

// ✅ Define ReportHandler correctly
type ReportHandler = (metric: Metric) => void;

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && typeof onPerfEntry === "function") {
    onCLS(onPerfEntry);
    onFID(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
};

export default reportWebVitals;
