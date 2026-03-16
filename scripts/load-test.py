"""
Kenya Overwatch - Python Load Test
Simple load testing without external dependencies

Usage:
  python scripts/load-test.py [--url URL] [--users USERS] [--duration SECONDS]
"""

import asyncio
import aiohttp
import time
import argparse
import sys
from dataclasses import dataclass, field
from typing import List


@dataclass
class Stats:
    total_requests: int = 0
    successful: int = 0
    failed: int = 0
    response_times: List[float] = field(default_factory=list)

    @property
    def avg_response_time(self) -> float:
        return sum(self.response_times) / len(self.response_times) if self.response_times else 0

    @property
    def p95_response_time(self) -> float:
        if not self.response_times:
            return 0
        sorted_times = sorted(self.response_times)
        idx = int(len(sorted_times) * 0.95)
        return sorted_times[idx]

    @property
    def error_rate(self) -> float:
        return (self.failed / self.total_requests * 100) if self.total_requests > 0 else 0


ENDPOINTS = [
    "/api/health",
    "/api/dashboard/stats",
    "/api/dashboard/summary",
    "/api/incidents",
    "/api/violations",
    "/api/violations/stats/revenue",
    "/api/vehicles",
    "/api/drivers",
    "/api/alerts",
    "/api/teams",
    "/api/roads",
    "/api/analytics/trends",
    "/api/enums/accident-types",
    "/api/settings",
]


async def make_request(session: aiohttp.ClientSession, url: str, stats: Stats):
    """Make a single request and record stats"""
    start = time.time()
    try:
        async with session.get(url) as response:
            await response.text()
            elapsed = (time.time() - start) * 1000
            stats.response_times.append(elapsed)
            stats.total_requests += 1
            if response.status == 200:
                stats.successful += 1
            else:
                stats.failed += 1
    except Exception:
        elapsed = (time.time() - start) * 1000
        stats.response_times.append(elapsed)
        stats.total_requests += 1
        stats.failed += 1


async def user_session(base_url: str, duration: int, stats: Stats):
    """Simulate a single user making requests"""
    end_time = time.time() + duration
    async with aiohttp.ClientSession() as session:
        while time.time() < end_time:
            for endpoint in ENDPOINTS:
                if time.time() >= end_time:
                    break
                url = f"{base_url}{endpoint}"
                await make_request(session, url, stats)
                await asyncio.sleep(0.1)  # Small delay between requests


async def run_load_test(base_url: str, num_users: int, duration: int):
    """Run load test with multiple concurrent users"""
    stats = Stats()

    print(f"""
=========================================
  Kenya Overwatch Load Test
=========================================
  URL: {base_url}
  Users: {num_users}
  Duration: {duration}s
=========================================
""")

    start_time = time.time()

    # Create concurrent user sessions
    tasks = [user_session(base_url, duration, stats) for _ in range(num_users)]
    await asyncio.gather(*tasks)

    elapsed = time.time() - start_time

    # Print results
    print(f"""
=========================================
  Load Test Results
=========================================
  Duration: {elapsed:.1f}s
  Total Requests: {stats.total_requests}
  Successful: {stats.successful}
  Failed: {stats.failed}
  Error Rate: {stats.error_rate:.1f}%
  
  Response Times:
    Avg: {stats.avg_response_time:.1f}ms
    P95: {stats.p95_response_time:.1f}ms
  
  Requests/sec: {stats.total_requests / elapsed:.1f}
=========================================
""")

    # Exit with error if too many failures
    if stats.error_rate > 10:
        print("ERROR: Error rate exceeds 10% threshold!")
        sys.exit(1)

    if stats.p95_response_time > 2000:
        print("WARNING: P95 response time exceeds 2s threshold!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Kenya Overwatch Load Test")
    parser.add_argument("--url", default="http://localhost:8001", help="Base URL")
    parser.add_argument("--users", type=int, default=10, help="Number of concurrent users")
    parser.add_argument("--duration", type=int, default=30, help="Test duration in seconds")
    args = parser.parse_args()

    asyncio.run(run_load_test(args.url, args.users, args.duration))
