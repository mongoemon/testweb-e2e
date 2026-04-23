import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/2.4.0/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export function summary(data, filename) {
  var out = {};
  out['k6/reports/' + filename] = htmlReport(data);
  out['stdout'] = textSummary(data, { indent: ' ', enableColors: true });
  return out;
}
