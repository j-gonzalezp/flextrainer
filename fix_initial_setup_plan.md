# Plan to Fix TypeScript Errors in ManageMesocycleModal.tsx

**Problem:**

TypeScript errors in `src/features/initialSetup/components/ManageMesocycleModal.tsx` indicate that the types for `reps`, `weight`, and `duration_seconds` are not correctly assigned when creating a `GoalInsert` object. The component is assigning values that can be `number | "" | null` to properties that expect `number | null` or `number | null | undefined`.

**Root Cause:**

The issue stems from the input fields in the modal, which can return empty strings.

**Solution:**

Modify the code to handle the empty string case. This involves converting the empty string to `null` before assigning it to the `GoalInsert` object.

**Steps:**

1.  **Inspect the code:** Use `read_file` to examine the relevant code in `src/features/initialSetup/components/ManageMesocycleModal.tsx` around lines 228-230 and in `src/features/goalsManagement/types.ts` to understand the context of the error.
2.  **Identify the source of the empty string:** Determine where the empty string is being introduced. It's likely coming from an input field that isn't properly converting to a number.
3.  **Implement a fix:** Modify the code to handle the empty string case. This could involve:
    *   Converting the empty string to `null` before assigning it to the `GoalInsert` object.
    *   Using a conditional to only assign the value if it's a valid number.
4.  **Apply the changes:** Use `apply_diff` to apply the fix to `src/features/initialSetup/components/ManageMesocycleModal.tsx`. Use a ternary operator to check if the value is an empty string. If it is, convert it to `null`; otherwise, convert it to a number using `Number()` or keep it as null if it's already null.
5.  **Verify the fix:** After applying the changes, the TypeScript errors should be resolved.