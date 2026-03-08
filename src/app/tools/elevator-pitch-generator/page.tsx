import type { Metadata } from 'next';
import ElevatorPitchClient from './ElevatorPitchClient';

export const metadata: Metadata = {
  title: 'Elevator Pitch Generator | jobTED AI',
  description:
    'Create confident, memorable elevator pitches for networking events, career fairs, interviews, and online bios. 30-second and 60-second versions.',
};

export default function ElevatorPitchGeneratorPage() {
  return <ElevatorPitchClient />;
}
