-- Add dietary restrictions column to user_profile table
-- This stores an array of dietary restriction keys

ALTER TABLE user_profile 
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[] DEFAULT '{}';

-- Example restriction values:
-- 'halal' - Islamic dietary laws
-- 'kosher' - Jewish dietary laws  
-- 'vegetarian' - No meat
-- 'vegan' - No animal products
-- 'gluten_free' - No gluten
-- 'dairy_free' - No dairy products
-- 'nut_free' - No nuts
-- 'shellfish_free' - No shellfish
-- 'low_sodium' - Low salt diet
-- 'low_carb' - Low carbohydrate diet

-- Comment for documentation
COMMENT ON COLUMN user_profile.dietary_restrictions IS 'Array of dietary restriction keys: halal, kosher, vegetarian, vegan, gluten_free, dairy_free, nut_free, shellfish_free, low_sodium, low_carb';

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_profile_dietary_restrictions ON user_profile USING GIN (dietary_restrictions);

