import { describe, expect, test } from "bun:test";
import type { JobCounts, QueueJobsPage, QueueRef } from "../server/index";
import { createInitialState, reducer } from "./reducer";

const queue: QueueRef = { name: "emails", prefix: "bull" };

function createQueueInfo(concurrency?: number): JobCounts {
  return {
    ...queue,
    meta: { concurrency },
    counts: {
      completed: 0,
      failed: 0,
      delayed: 0,
      active: 0,
      wait: 0,
      "waiting-children": 0,
      prioritized: 0,
      repeat: 0,
    },
  };
}

function createJobsPage(page: number): QueueJobsPage {
  return {
    jobs: [],
    page,
    pageSize: 10,
    status: null,
    searchQuery: "",
    total: 0,
    hasNextPage: false,
  };
}

describe("reducer", () => {
  test("ignores a stale jobs response", () => {
    const state = {
      ...createInitialState(true),
      selectedQueue: queue,
      jobsPage: 2,
      isLoadingJobs: true,
    };

    const nextState = reducer(state, {
      type: "jobsLoaded",
      queue,
      result: createJobsPage(1),
    });

    expect(nextState).toBe(state);
  });

  test("resets queue-specific state when returning to the queue list", () => {
    const state = {
      ...createInitialState(true),
      selectedQueue: queue,
      jobsPage: 3,
      jobsTotal: 20,
      isSettingQueueConcurrency: true,
      isRateLimitingQueue: true,
    };

    const nextState = reducer(state, { type: "showQueues" });

    expect(nextState.selectedQueue).toBeNull();
    expect(nextState.jobsPage).toBe(1);
    expect(nextState.jobsTotal).toBe(0);
    expect(nextState.isSettingQueueConcurrency).toBeFalse();
    expect(nextState.isRateLimitingQueue).toBeFalse();
  });

  test("updates queue metadata after setting concurrency", () => {
    const currentQueueInfo = createQueueInfo(2);
    const updatedQueueInfo = createQueueInfo(8);
    const state = {
      ...createInitialState(true),
      queues: [currentQueueInfo],
      selectedQueue: queue,
      isSettingQueueConcurrency: true,
    };

    const nextState = reducer(state, {
      type: "queueConcurrencySet",
      queue,
      concurrency: 8,
      queueInfo: updatedQueueInfo,
    });

    expect(nextState.queues).toEqual([updatedQueueInfo]);
    expect(nextState.isSettingQueueConcurrency).toBeFalse();
    expect(nextState.jobsMessage).toBe(
      'Set concurrency for queue "emails" to 8.',
    );
  });
});
