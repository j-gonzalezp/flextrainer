# Plan to Fix Initial Setup Weight and Duration Issue

**Problem:**

The suggested weights and durations in the initial setup modal are not being saved to the database correctly. This is because the `Step3ParameterConfig` component converts `NaN` values to empty strings (`''`), and the `handleToggleChosenExercise` function in `ManageMesocycleModal.tsx` initializes the `weight` and `duration_seconds` properties with empty strings (`''`) if the default values are null.

**Solution:**

1.  Modify `handleToggleChosenExercise` in `ManageMesocycleModal.tsx`:
    *   Replace `weight: exercise.default_weight ?? '',` with `weight: exercise.default_weight ?? null,`
    *   Replace `duration_seconds: exercise.default_duration_seconds ?? '',` with `duration_seconds: exercise.default_duration_seconds ?? null,`
2.  Modify `handleParamChange` in `Step3ParameterConfig.tsx`:
    *   Replace `parsedValue = '';` with `parsedValue = null;` in the `if (isNaN(parsedValue))` blocks for both `weight` and `duration_seconds`.

**Testing:**

1.  Manually test the component by selecting exercises with and without default weights and durations.
2.  Verify that the suggested weights and durations are correctly displayed in the `Step3ParameterConfig.tsx` component.
3.  Verify that the values are correctly saved to the database as numbers or `null`.

**Impact:**

The potential impact of this change is minimal. The only code that is being modified is the `handleParamChange` function in `Step3ParameterConfig.tsx` and the `handleToggleChosenExercise` function in `ManageMesocycleModal.tsx`. The changes are limited to the handling of empty and invalid numerical inputs.

**Rollback Plan:**

If any issues arise after deploying the changes, revert the changes to the `handleParamChange` function in `Step3ParameterConfig.tsx` and the `handleToggleChosenExercise` function in `ManageMesocycleModal.tsx`.