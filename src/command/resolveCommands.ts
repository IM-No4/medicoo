import { SearchResult } from '@/src/search/search.types';
import { CommandItem } from './command.types';
import { STATIC_COMMANDS } from './commandRegistry';

export function resolveCommands(
  query: string,
  searchResults: SearchResult[]
): CommandItem[] {
  const q = query.toLowerCase();

  const actionMatches = STATIC_COMMANDS.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.keywords?.some((k) => k.includes(q))
  );

  const searchMatches: CommandItem[] = searchResults.map((r) => ({
    id: `search-${r.id}`,
    title: r.title,
    subtitle: r.subtitle,
    actionKey: r.action.key,
    params: r.action.params,
  }));

  return [...actionMatches, ...searchMatches];
}
