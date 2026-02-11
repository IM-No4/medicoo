import { SearchResult } from '@/src/search/search.types';

type GroupedResults = {
  title: string;
  items: SearchResult[];
};

export function groupSearchResults(
  results: SearchResult[]
): GroupedResults[] {
  const groups: GroupedResults[] = [];

  const pushIfExists = (title: string, items: SearchResult[]) => {
    if (items.length) {
      groups.push({ title, items });
    }
  };

  pushIfExists(
    'Doctors',
    results.filter((r) => r.domain === 'doctor')
  );

  pushIfExists(
    'Medicines',
    results.filter((r) => r.domain === 'medicine')
  );

  pushIfExists(
    'Pharmacies',
    results.filter((r) => r.domain === 'pharmacy')
  );

  pushIfExists(
    'Lab Tests',
    results.filter((r) => r.domain === 'lab_test')
  );

  return groups;
}
