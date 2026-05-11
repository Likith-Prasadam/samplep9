import * as yup from 'yup';

export const loginSchema = yup.object({
  username: yup.string().trim().required('Username is required'),
  password: yup.string().required('Password is required'),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;
