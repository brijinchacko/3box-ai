import type { Metadata } from 'next';
import ForgotPasswordClient from './ForgotPasswordClient';

export const metadata: Metadata = {
  title: 'Reset Password — NXTED AI',
  description: 'Reset your NXTED AI account password. Get back to your AI career coach, resume builder, and job matching dashboard.',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
