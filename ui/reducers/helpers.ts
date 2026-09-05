import type { QueueJobSummary, QueueRef } from "../../server/index";

export function isSameQueue(left: QueueRef | null, right: QueueRef) {
  return left?.name === right.name && left.prefix === right.prefix;
}

export function jobMatchesSearch(
  job: QueueJobSummary,
  searchQuery: string,
) {
  const query = searchQuery.toLowerCase();
  return (
    !query ||
    job.id.toLowerCase().includes(query) ||
    job.name.toLowerCase().includes(query)
  );
}
