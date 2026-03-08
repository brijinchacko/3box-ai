import type { Metadata } from 'next';
import ForgotPasswordClient from './ForgotPasswordClient';

export const metadata: Metadata = {
  title: 'Reset Password — jobTED AI',
  description: 'Reset your jobTED AI account password. Get back to your AI career coach, resume builder, and job matching dashboard.',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
