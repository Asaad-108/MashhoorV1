import { predictCampaignROIWithML, trustRegressionModel, trustBenchmarkDataset } from "./src/services/mlService";

const roiResult = predictCampaignROIWithML(10000, 5, 80, 20000, 2500);
console.log("ROI Metrics:", roiResult.aiModelMetrics);

const trustMetrics = trustRegressionModel.evaluate(trustBenchmarkDataset);
console.log("Trust Metrics:", trustMetrics);
