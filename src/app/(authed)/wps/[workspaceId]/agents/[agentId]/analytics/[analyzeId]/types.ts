// Root type
export interface EstimationReport {
  analysis: Analysis;
  document: DocumentMeta;
  estimation: Estimation;
}

// ===== Analysis =====
export interface Analysis {
  cocomo: Cocomo;
  features: FeaturesSummary;
  confidence: ConfidenceBlock;
  loc_linear: LocModelMetrics;
  ml_features: MLFeatures;
  requirements: Requirement[];
  function_points: FunctionPoints;
  use_case_points: UseCasePoints;
  loc_random_forest: LocModelMetrics;
}

export interface Cocomo {
  size: number;
  reuse: number;
  complexity: number;
  reliability: number;
  documentation: number;
  team_cohesion: number;
  time_constraint: number;
  tool_experience: number;
  process_maturity: number;
  storage_constraint: number;
  language_experience: number;
  platform_volatility: number;
  personnel_capability: number;
  personnel_experience: number;
}

export interface FeaturesSummary {
  size: number;
  entities: number;
  complexity: number;
  reliability: number;
  technologies: string[];
  functional_reqs: number;
  text_complexity: number;
  num_requirements: number;
  num_technologies: number;
  non_functional_reqs: number;
  has_data_requirements: boolean;
  has_security_requirements: boolean;
  has_interface_requirements: boolean;
  has_performance_requirements: boolean;
}

export interface ConfidenceBlock {
  confidence_factors: {
    text_length: boolean;
    has_features: boolean;
    has_sections: boolean;
    model_agreement: boolean;
    has_loc_estimate: boolean;
    has_requirements: boolean;
  };
  confidence_explanation: string;
}

export interface LocModelMetrics {
  loc: number;
  kloc: number;
  complexity: number;
  developers: number;
  experience: number;
  tech_score: number;
}

export interface MLFeatures {
  size: number;
  schema: number;
  entities: number;
  team_exp: number;
  adjustment: number;
  complexity: number;
  developers: number;
  fp_per_dev: number;
  manager_exp: number;
  time_months: number;
  fp_per_month: number;
  kloc_per_dev: number;
  transactions: number;
  kloc_per_month: number;
  points_non_adjust: number;
}

export type RequirementType =
  | 'general'
  | 'interface'
  | 'data'
  | 'functional'
  | 'non_functional'
  | 'performance';

export interface Requirement {
  id: string;
  text: string;
  type: RequirementType | (string & {}); // mở rộng nếu có loại khác
}

export interface FunctionPoints {
  external_files: number;
  internal_files: number;
  external_inputs: number;
  external_outputs: number;
  external_inquiries: number;
  complexity_multiplier: number;
}

export interface UseCasePoints {
  simple_actors: number;
  average_actors: number;
  complex_actors: number;
  simple_use_cases: number;
  average_use_cases: number;
  complex_use_cases: number;
  technical_factors: number;
  environmental_factors: number;
}

// ===== Document =====
export interface DocumentMeta {
  filename: string;
  file_type: string;
  size_bytes: number;
  text_length: number;
}

// ===== Estimation =====
export interface Estimation {
  duration: number;
  team_size: number;
  total_effort: number;
  model_estimates: ModelEstimates;
  confidence_level: 'Low' | 'Medium' | 'High' | (string & {});
}

export interface ModelEstimates {
  cocomo: number;
  loc_linear: number;
  cocomo_name: string;
  cocomo_type: string;
  function_points: number;
  loc_linear_name: string;
  loc_linear_type: string;
  use_case_points: number;

  ml_Decision_Tree: number;
  ml_Random_Forest: number;
  ml_Gradient_Boosting: number;
  ml_Linear_Regression: number;

  cocomo_confidence: number;
  loc_linear_confidence: number;
  function_points_confidence: number;
  use_case_points_confidence: number;
  ml_Decision_Tree_confidence: number;
  ml_Random_Forest_confidence: number;
  ml_Gradient_Boosting_confidence: number;
  ml_Linear_Regression_confidence: number;
  loc_random_forest_confidence: number;

  cocomo_description: string;
  loc_linear_description: string;
  function_points_description: string;
  use_case_points_description: string;
  ml_Decision_Tree_description: string;
  ml_Random_Forest_description: string;
  ml_Gradient_Boosting_description: string;
  ml_Linear_Regression_description: string;
  loc_random_forest_description: string;

  ml_Decision_Tree_name: string;
  ml_Decision_Tree_type: string;
  ml_Random_Forest_name: string;
  ml_Random_Forest_type: string;
  ml_Gradient_Boosting_name: string;
  ml_Gradient_Boosting_type: string;
  ml_Linear_Regression_name: string;
  ml_Linear_Regression_type: string;

  loc_random_forest: number;
  loc_random_forest_name: string;
  loc_random_forest_type: string;
}
    