import * as yup from 'yup';

export const profileFormSchema = yup.object().shape({
  first_name: yup
    .string()
    .min(2, 'First name must be at least 2 characters.')
    .max(30, 'First name must not be longer than 30 characters.')
    .required('First name is required'),
  last_name: yup
    .string()
    .min(1, 'Last name must be at least 1 characters.')
    .max(30, 'Last name must not be longer than 30 characters.')
    .required('Last name is required'),
  gender: yup.string().notRequired(),
  user_language: yup.string().required('Please select a language'),
  date_of_birth: yup.date().notRequired(),
  email_id: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  registered_location: yup.string().notRequired(),
  phone_number: yup
    .string()
    .notRequired()
    .test('is-numeric', 'Phone number must contain only numbers', (value) => {
      if (!value) return true;
      return /^\d+$/.test(value);
    })
    .test(
      'is-ten-digits',
      'Phone number must be exactly 10 digits',
      (value) => {
        if (!value) return true;
        return value.length === 10;
      }
    ),
});

export type ProfileFormValues = yup.InferType<typeof profileFormSchema>;

export interface UserProfileData {
  user_id: string;
  first_name: string;
  last_name: string;
  gender?: string;
  user_language: string;
  date_of_birth?: Date | null;
  email_id: string;
  registered_location?: string;
  phone_number?: string;
}
