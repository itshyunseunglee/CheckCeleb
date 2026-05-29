import ResultsClient from './ResultsClient';

interface PageProps {
  params: Promise<{ channelId: string }>;
  searchParams: Promise<{ options?: string; startDate?: string; endDate?: string }>;
}

export default async function ResultsPage({ params, searchParams }: PageProps) {
  const { channelId } = await params;
  const { options, startDate, endDate } = await searchParams;
  return <ResultsClient channelId={channelId} optionsParam={options} startDateParam={startDate} endDateParam={endDate} />;
}
