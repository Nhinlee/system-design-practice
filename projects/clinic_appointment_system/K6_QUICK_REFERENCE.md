# k6 Quick Reference

## Common Commands

### Running Tests

```bash
# Smoke test (30 seconds, 10 VUs)
make test-smoke
pnpm run test:smoke
node cli.js test:smoke
k6 run test/load/k6-smoke-test.js

# Load test (8 minutes, up to 100 VUs)
make test-load
pnpm run test:load
node cli.js test:load
k6 run test/load/k6-load-test.js

# Stress test (60 seconds, 50 VUs)
make test-stress
pnpm run test:stress
node cli.js test:stress
k6 run test/load/k6-stress-test.js
```

### Viewing Reports

```bash
# Open HTML reports
make report-smoke
make report-load
make report-stress

# Or directly
open test/load/results/k6-smoke-test.html
open test/load/results/k6-load-test.html
open test/load/results/k6-stress-test.html
```

### Custom Options

```bash
# Custom VUs and duration
k6 run --vus 20 --duration 5m test/load/k6-smoke-test.js

# With custom environment
BASE_URL=http://staging.example.com k6 run test/load/k6-load-test.js

# Save results to file
k6 run --out json=results.json test/load/k6-load-test.js

# Quiet mode
k6 run --quiet test/load/k6-smoke-test.js
```

## Test File Structure

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Custom metrics
const errorRate = new Rate('errors');
const myCounter = new Counter('my_metric');

// Test configuration
export const options = {
  // Simple load
  vus: 10,
  duration: '30s',
  
  // OR staged load
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  
  // Thresholds
  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
  },
};

const BASE_URL = 'http://localhost:3000';

// Main test function (runs for each VU iteration)
export default function () {
  const response = http.get(`${BASE_URL}/api/endpoint`);
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => r.json().data !== undefined,
  });
  
  errorRate.add(!success);
  sleep(1);
}

// Setup (runs once at start)
export function setup() {
  console.log('Starting test...');
  return { someData: 'value' };
}

// Teardown (runs once at end)
export function teardown(data) {
  console.log('Test completed!');
}

// Custom summary handler
export function handleSummary(data) {
  return {
    'test/load/results/report.html': htmlReport(data),
    'test/load/results/report.json': JSON.stringify(data, null, 2),
    stdout: '\n' + JSON.stringify(data, null, 2) + '\n',
  };
}
```

## Key Concepts

### Virtual Users (VUs)

```javascript
// Fixed VUs
export const options = {
  vus: 50,
  duration: '2m',
};

// Ramping VUs
export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};
```

### HTTP Requests

```javascript
// GET request
const res = http.get('http://localhost:3000/api/users');

// POST request
const res = http.post(
  'http://localhost:3000/api/users',
  JSON.stringify({ name: 'John' }),
  { headers: { 'Content-Type': 'application/json' } }
);

// Multiple requests (batch)
const responses = http.batch([
  ['GET', 'http://localhost:3000/api/users'],
  ['GET', 'http://localhost:3000/api/posts'],
]);
```

### Checks (Assertions)

```javascript
check(response, {
  'status is 200': (r) => r.status === 200,
  'status is not 404': (r) => r.status !== 404,
  'response time OK': (r) => r.timings.duration < 500,
  'has correct data': (r) => r.json().data.id === '123',
  'body contains text': (r) => r.body.includes('success'),
});
```

### Metrics

```javascript
import { Counter, Rate, Gauge, Trend } from 'k6/metrics';

// Counter: cumulative metric
const myCounter = new Counter('my_counter');
myCounter.add(1);

// Rate: percentage/ratio
const errorRate = new Rate('errors');
errorRate.add(response.status !== 200);

// Gauge: current value
const activeUsers = new Gauge('active_users');
activeUsers.add(currentUsers);

// Trend: statistics (min, max, avg, percentiles)
const customTiming = new Trend('custom_duration');
customTiming.add(response.timings.duration);
```

### Thresholds

```javascript
export const options = {
  thresholds: {
    // Built-in metrics
    'http_req_failed': ['rate<0.01'],      // Error rate < 1%
    'http_req_duration': ['p(95)<2000'],   // 95th percentile < 2s
    'http_reqs': ['count>1000'],           // At least 1000 requests
    'vus': ['value>10'],                   // At least 10 VUs
    
    // Custom metrics
    'errors': ['rate<0.05'],               // Custom error rate
    'booking_time': ['avg<1000'],          // Custom average
    
    // Tagged metrics
    'http_req_duration{name:api}': ['p(99)<3000'],
  },
};
```

### Sleep & Think Time

```javascript
import { sleep } from 'k6';

export default function () {
  http.get('http://localhost:3000/api/users');
  sleep(1);                    // Sleep 1 second
  
  http.get('http://localhost:3000/api/posts');
  sleep(Math.random() * 3);    // Random 0-3 seconds
}
```

### Scenarios

```javascript
export const options = {
  scenarios: {
    smoke_test: {
      executor: 'constant-vus',
      exec: 'smokeTest',
      vus: 10,
      duration: '1m',
    },
    load_test: {
      executor: 'ramping-vus',
      exec: 'loadTest',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 0 },
      ],
    },
  },
};

export function smokeTest() {
  // Smoke test logic
}

export function loadTest() {
  // Load test logic
}
```

## Built-in Metrics

| Metric | Description |
|--------|-------------|
| `http_reqs` | Total HTTP requests |
| `http_req_duration` | Request duration |
| `http_req_failed` | Failed request rate |
| `http_req_waiting` | Time waiting for response |
| `http_req_connecting` | Time establishing connection |
| `http_req_tls_handshaking` | TLS handshake time |
| `http_req_sending` | Time sending data |
| `http_req_receiving` | Time receiving data |
| `vus` | Current virtual users |
| `vus_max` | Max virtual users |
| `iterations` | Iterations completed |
| `iteration_duration` | Iteration duration |
| `data_received` | Data received |
| `data_sent` | Data sent |

## Common Patterns

### Load Profile: Spike Test

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Normal load
    { duration: '10s', target: 100 }, // Spike!
    { duration: '2m', target: 10 },   // Back to normal
  ],
};
```

### Load Profile: Soak Test

```javascript
export const options = {
  stages: [
    { duration: '5m', target: 50 },   // Ramp up
    { duration: '4h', target: 50 },   // Stay for 4 hours
    { duration: '5m', target: 0 },    // Ramp down
  ],
};
```

### Authenticated Requests

```javascript
export function setup() {
  const loginRes = http.post('http://localhost:3000/auth/login', {
    username: 'user',
    password: 'pass',
  });
  return { token: loginRes.json('token') };
}

export default function (data) {
  http.get('http://localhost:3000/api/protected', {
    headers: { Authorization: `Bearer ${data.token}` },
  });
}
```

### Random Data

```javascript
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export default function () {
  const payload = {
    name: randomString(10),
    age: randomIntBetween(18, 65),
  };
  
  http.post('http://localhost:3000/api/users', JSON.stringify(payload));
}
```

## Debugging

```bash
# Verbose output
k6 run --verbose test/load/k6-smoke-test.js

# HTTP debug
k6 run --http-debug test/load/k6-smoke-test.js

# Show all logs
k6 run --log-output=stdout test/load/k6-smoke-test.js

# Console.log in script
export default function () {
  console.log('Debug:', response.body);
}
```

## Best Practices

1. **Start Small**: Begin with smoke tests, then scale up
2. **Use Checks**: Validate responses, don't just send requests
3. **Set Thresholds**: Define success criteria upfront
4. **Think Time**: Add realistic pauses between requests
5. **Ramp Up**: Don't hit peak load immediately
6. **Monitor**: Watch both k6 metrics and application metrics
7. **Realistic Data**: Use varied, realistic test data
8. **Clean Up**: Consider teardown for cleanup tasks

## Helpful Links

- [k6 Docs](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [k6 Extensions](https://k6.io/docs/extensions/)
- [k6 Community](https://community.k6.io/)
