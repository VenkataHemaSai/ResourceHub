/**
 * Maps server-side error fields to a React Hook Form.
 * @param {object} fields - The `fields` object from the API Error (e.g. { email: "Invalid email" })
 * @param {import("react-hook-form").UseFormReturn} form - The react-hook-form instance
 */
export function setFormErrors(fields, form) {
  if (!fields || typeof fields !== 'object') return;
  
  Object.entries(fields).forEach(([field, message]) => {
    form.setError(field, {
      type: 'server',
      message: message
    });
  });
}
