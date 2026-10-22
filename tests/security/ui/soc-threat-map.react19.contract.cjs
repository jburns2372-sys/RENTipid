// Real React 19 + react-simple-maps render regression. No database or provider access.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost', pretendToBeVisual: true });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'SVGElement', 'SVGSVGElement', 'MouseEvent']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// jsdom has no SVG layout; supply the dimensions declared by the actual component.
Object.defineProperty(dom.window.SVGSVGElement.prototype, 'viewBox', { get: () => ({ baseVal: { x: 0, y: 0, width: 800, height: 500 } }) });
require('tsx/cjs');
const React = require('react');
const { render, fireEvent, waitFor, cleanup, act } = require('@testing-library/react');
const { SocThreatMap } = require('../../../src/components/security/dashboard/SocThreatMap.tsx');
const topology = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../public/maps/world-110m.json'), 'utf8'));
const fixture = {
  markers: [{ marker_id: 'ph-test', country_code: 'PH', country_name: 'Philippines', longitude: 121, latitude: 14,
    location_precision: 'COUNTRY_APPROXIMATE', event_count: 3, highest_severity: 'HIGH', security_domains: ['Authentication'],
    latest_event_at: '2026-10-22T00:00:00Z', recent_event_count: 3, environment: 'TEST', lifecycle: 'TEST' }],
  summary: { geolocatedEvents: 3, countries: 1, criticalHighEvents: 3 }, unresolvedLocationCount: 0,
  privateOrReservedIpCount: 0, providerStatus: 'TEST', lastUpdatedAt: '2026-10-22T00:00:00Z', refreshAfterSeconds: 0,
};
const originalFetch = globalThis.fetch;
after(() => { cleanup(); globalThis.fetch = originalFetch; dom.window.close(); });
async function mount(response = fixture, status = 200) {
  globalThis.fetch = async (url) => {
    if (url === '/maps/world-110m.json') return { ok: true, json: async () => topology };
    assert.equal(url, '/api/soc/threat-map?limit=500', 'unexpected network access');
    return { ok: status === 200, status, json: async () => response };
  };
  const view = render(React.createElement(SocThreatMap));
  await waitFor(() => assert.ok(view.container.querySelector('.rsm-geography')));
  return view;
}
test('React 19 renders the bundled world, geography styles, graticule and projected threat marker', async () => {
  assert.match(React.version, /^19\./);
  const view = await mount();
  const countries = view.container.querySelectorAll('.rsm-geography');
  assert.equal(countries.length, topology.objects.countries.geometries.length);
  for (const country of countries) {
    assert.ok(country.getAttribute('d')?.startsWith('M'));
    assert.equal(country.getAttribute('fill'), '#0f172a');
    assert.equal(country.getAttribute('stroke'), '#334155');
    assert.ok(country.classList.contains('outline-none'));
    assert.ok(country.classList.contains('hover:fill-[#1e293b]'));
    assert.ok(country.classList.contains('focus:fill-[#1e293b]'));
    assert.ok(country.classList.contains('active:fill-[#0f172a]'));
  }
  assert.ok(view.container.querySelector('.rsm-graticule').getAttribute('d'));
  const marker = view.container.querySelector('.rsm-marker');
  assert.match(marker.getAttribute('transform'), /^translate\(/);
  assert.ok(!/NaN|Infinity/.test(marker.getAttribute('transform')));
  assert.equal(marker.querySelector('circle').getAttribute('fill'), '#f97316');
  assert.equal(marker.querySelector('circle').getAttribute('r'), '6');
  fireEvent.click(marker);
  assert.ok(view.getByText('Philippines'));
  assert.ok(view.getByText('Threat Cluster'));
  fireEvent.click(view.getByTitle('Reset View'));
  assert.equal(view.queryByText('Threat Cluster'), null);
  cleanup();
});
test('zoom buttons, pan gesture and reset preserve the controlled map view', async () => {
  const view = await mount();
  const group = () => view.container.querySelector('.rsm-zoomable-group');
  const initial = group().getAttribute('transform');
  fireEvent.click(view.getByTitle('Zoom In'));
  await waitFor(() => assert.match(group().getAttribute('transform'), /scale\(2\)/));
  fireEvent.click(view.getByTitle('Zoom Out'));
  await waitFor(() => assert.match(group().getAttribute('transform'), /scale\(1\)/));
  const surface = group().parentElement.querySelector('rect');
  fireEvent.mouseDown(surface, { clientX: 200, clientY: 200, button: 0, view: dom.window });
  fireEvent.mouseMove(dom.window, { clientX: 250, clientY: 220, buttons: 1, view: dom.window });
  fireEvent.mouseUp(dom.window, { clientX: 250, clientY: 220, button: 0, view: dom.window });
  await waitFor(() => assert.notEqual(group().getAttribute('transform'), initial));
  await act(() => new Promise(resolve => setTimeout(resolve, 5)));
  fireEvent.click(view.getByTitle('Reset View'));
  await waitFor(() => assert.equal(group().getAttribute('transform'), initial));
  cleanup();
});
test('empty and unauthorized states remain visible without fabricating markers', async () => {
  let view = await mount({ ...fixture, markers: [], summary: { geolocatedEvents: 0, countries: 0, criticalHighEvents: 0 } });
  assert.ok(view.getByText('No geolocated security events are available for the selected period.'));
  assert.equal(view.container.querySelector('.rsm-marker'), null);
  cleanup();
  view = await mount(null, 403);
  assert.ok(view.getByText('Unauthorized Access'));
  assert.equal(view.container.querySelector('.rsm-marker'), null);
  cleanup();
});
