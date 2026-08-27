const VERSION = 'gonzo-health-response-semantics/1.0.1';
const app = document.querySelector('#app');
const labels = Object.freeze({
  red: ['Red', 'R'],
  blue: ['Blue', 'B'],
  green: ['Green', 'G'],
  yellow: ['Yellow', 'Y'],
  orange: ['Orange', 'O'],
  purple: ['Purple', 'P']
});

function findExam() {
  return app?.querySelector(
    '[data-gh-exam-root], .test-layout, .assessment-layout, .assessment-screen, [data-view="assessment"]'
  );
}

function enhanceResponseButtons() {
  const exam = findExam();
  if (!exam || exam.querySelector('[data-generation], [data-battery]')) return;

  const marked = new Set();
  for (const button of exam.querySelectorAll('button.response-button[data-response], button[data-response]')) {
    const response = button.dataset.response?.toLowerCase();
    const definition = labels[response];
    if (!definition) continue;

    button.dataset.ghResponse = '';
    button.dataset.ghColor = response;
    button.setAttribute('aria-label', `Respond ${definition[0]}`);
    button.setAttribute('aria-keyshortcuts', definition[1]);
    if (!button.hasAttribute('type')) button.type = 'button';
    marked.add(response);
  }
  exam.dataset.ghResponseCount = String(marked.size);
}

let scheduled = false;
const scheduleEnhancement = () => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    enhanceResponseButtons();
  });
};

const observer = new MutationObserver(scheduleEnhancement);
if (app) {
  observer.observe(app, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-gh-exam-root', 'data-view', 'data-response']
  });
}

enhanceResponseButtons();
window.addEventListener('pageshow', scheduleEnhancement);
window.__GONZO_HEALTH_RESPONSE_SEMANTICS__ = Object.freeze({
  version: VERSION,
  nativeButtons: true,
  directExamDiscovery: true
});
