import { redirect } from 'next/navigation';

// Default route always shows the grid
export default function Home() {
  redirect('/grid');
}
