"""
Kenya Overwatch - Load Testing Script (k6)

Usage:
  k6 run scripts/load-test.js
  k6 run --vus 10 --duration 30s scripts/load-test.js
  k6 run --out json=results.json scripts/load-test.js

Install k6:
  curl -sL https://github.com/grafana/k6/releases/download/v0.48.0/k6-v0.48.0-linux-amd64.tar.gz | tar xz
  sudo mv k6-v0.48.0-linux-amd64/k6 /usr/local/bin/
"""

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const requestCount = new Counter('total_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Ramp up to 5 users
    { duration: '30s', target: 10 },  // Stay at 10 users
    { duration: '20s', target: 20 },  // Ramp up to 20 users
    { duration: '30s', target: 20 },  // Stay at 20 users
    { duration: '10s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    errors: ['rate<0.1'],               // Error rate under 10%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8001';

export default function () {
  group('Health Endpoints', () => {
    const health = http.get(`${BASE_URL}/api/health`);
    check(health, {
      'health status 200': (r) => r.status === 200,
      'health response time < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(health.status !== 200);
    apiLatency.add(health.timings.duration);
    requestCount.add(1);
  });

  group('Dashboard Endpoints', () => {
    const stats = http.get(`${BASE_URL}/api/dashboard/stats`);
    check(stats, {
      'dashboard stats 200': (r) => r.status === 200,
      'dashboard has roads': (r) => JSON.parse(r.body).roads !== undefined,
    });
    errorRate.add(stats.status !== 200);
    apiLatency.add(stats.timings.duration);
    requestCount.add(1);

    const summary = http.get(`${BASE_URL}/api/dashboard/summary`);
    check(summary, { 'summary 200': (r) => r.status === 200 });
    errorRate.add(summary.status !== 200);
    requestCount.add(1);
  });

  group('Incidents Endpoints', () => {
    const incidents = http.get(`${BASE_URL}/api/incidents`);
    check(incidents, {
      'incidents list 200': (r) => r.status === 200,
      'incidents is array': (r) => Array.isArray(JSON.parse(r.body)),
    });
    errorRate.add(incidents.status !== 200);
    requestCount.add(1);
  });

  group('Violations Endpoints', () => {
    const violations = http.get(`${BASE_URL}/api/violations`);
    check(violations, { 'violations list 200': (r) => r.status === 200 });
    errorRate.add(violations.status !== 200);
    requestCount.add(1);

    const stats = http.get(`${BASE_URL}/api/violations/stats/revenue`);
    check(stats, { 'violation stats 200': (r) => r.status === 200 });
    errorRate.add(stats.status !== 200);
    requestCount.add(1);
  });

  group('Vehicles Endpoints', () => {
    const vehicles = http.get(`${BASE_URL}/api/vehicles`);
    check(vehicles, { 'vehicles list 200': (r) => r.status === 200 });
    errorRate.add(vehicles.status !== 200);
    requestCount.add(1);
  });

  group('Drivers Endpoints', () => {
    const drivers = http.get(`${BASE_URL}/api/drivers`);
    check(drivers, { 'drivers list 200': (r) => r.status === 200 });
    errorRate.add(drivers.status !== 200);
    requestCount.add(1);
  });

  group('Other Endpoints', () => {
    const alerts = http.get(`${BASE_URL}/api/alerts`);
    check(alerts, { 'alerts 200': (r) => r.status === 200 });
    requestCount.add(1);

    const teams = http.get(`${BASE_URL}/api/teams`);
    check(teams, { 'teams 200': (r) => r.status === 200 });
    requestCount.add(1);

    const roads = http.get(`${BASE_URL}/api/roads`);
    check(roads, { 'roads 200': (r) => r.status === 200 });
    requestCount.add(1);

    const analytics = http.get(`${BASE_URL}/api/analytics/trends`);
    check(analytics, { 'analytics 200': (r) => r.status === 200 });
    requestCount.add(1);

    const settings = http.get(`${BASE_URL}/api/settings`);
    check(settings, { 'settings 200': (r) => r.status === 200 });
    requestCount.add(1);
  });

  sleep(0.5);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  return `
=========================================
  Kenya Overwatch Load Test Results
=========================================

Test Duration: ${data.state.testRunDurationMs / 1000}s
Total Requests: ${data.metrics.total_requests ? data.metrics.total_requests.values.count : 'N/A'}

HTTP Metrics:
  - Avg Response Time: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values.avg.toFixed(2) : 'N/A'}ms
  - P95 Response Time: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'].toFixed(2) : 'N/A'}ms
  - Error Rate: ${data.metrics.errors ? (data.metrics.errors.values.rate * 100).toFixed(2) : 'N/A'}%

Thresholds:
${Object.entries(data.metrics).filter(([k, v]) => v.thresholds).map(([k, v]) => {
  return Object.entries(v.thresholds).map(([threshold, passed]) => 
    `  - ${k}: ${threshold} => ${passed.ok ? 'PASS' : 'FAIL'}`
  ).join('\n');
}).filter(Boolean).join('\n')}

=========================================
`;
}
