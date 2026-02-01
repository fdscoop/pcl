import { setRequestLocale } from 'next-intl/server';
import HomeClient from '@/components/home/HomeClient';

export const metadata = {
  title: 'Professional Club League - PCL',
  description: 'The complete sports management platform for clubs, players, referees, staff, and stadium owners',
};

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  return <HomeClient />;
}
