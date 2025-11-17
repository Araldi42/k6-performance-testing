import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// 🧮 Métricas personalizadas
export const getPostsDuration = new Trend('get_posts_duration', true);
export const getPostByIdDuration = new Trend('get_post_by_id_duration', true);
export const RateContentOK = new Rate('content_OK');

// ⚙️ Configurações do teste
export const options = {
  thresholds: {
    http_req_failed: ['rate<0.30'], // Máx. 30% de falhas
    get_posts_duration: ['p(99)<500'], // 99% das reqs < 500ms
    get_post_by_id_duration: ['p(99)<500'],
    content_OK: ['rate>0.95'] // Pelo menos 95% sucesso
  },
  stages: [
    { duration: '3s', target: 2 },
    { duration: '3s', target: 6 },
    { duration: '3s', target: 9 }
  ]
};

// 🧾 Geração de relatório HTML + resumo no terminal
export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

// 🧪 Cenário principal
export default function () {
  const baseUrl = 'https://jsonplaceholder.typicode.com';
  const params = {
    headers: { 'Content-Type': 'application/json' }
  };
  const OK = 200;

  // 1️⃣ GET /posts
  const resPosts = http.get(`${baseUrl}/posts`, params);
  getPostsDuration.add(resPosts.timings.duration);
  RateContentOK.add(resPosts.status === OK);
  check(resPosts, {
    'GET /posts - Status 200': () => resPosts.status === OK
  });

  // 2️⃣ GET /posts/1
  const resPostById = http.get(`${baseUrl}/posts/1`, params);
  getPostByIdDuration.add(resPostById.timings.duration);
  RateContentOK.add(resPostById.status === OK);
  check(resPostById, {
    'GET /posts/1 - Status 200': () => resPostById.status === OK
  });
}
