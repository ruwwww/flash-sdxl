// Features Config Structure (Based on Feature Matrix)
export interface FeatureConfig {
  text_to_image: 'enabled' | 'disabled';
  hires_fix: 'enabled' | 'disabled' | 'premium';
  lora: 'enabled' | 'disabled' | 'premium';
  refiner: 'enabled' | 'disabled' | 'premium';
}

export const DEFAULT_FEATURE_CONFIG: FeatureConfig = {
  text_to_image: 'enabled',
  hires_fix: 'premium',
  lora: 'premium',
  refiner: 'disabled'
};
