const VERSION = 'gonzo-health-response-semantics/1.0.0';
const app = document.querySelector('#app');
const labels = Object.freeze({
  red: ['Red', 'R'],
  blue: ['Blue', 'B'],
  green: ['Green', 'G'],
  yellow: ['Yellow', 'Y'],
  orange: ['Orange', 'O'],
  purple: ['Purple', 'P']
});

function enhanceResponseButtons() {
  const exam = app?.querySelector('[data-gh-exam-root]');
  if (!exam) return;

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
const observer = new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    enhanceResponseButtons();
  });
});

if (app) observer.observe(app, { childList: true, subtree: true });
enhanceResponseButtons();
window.addEventListener('pageshow', enhanceResponseButtons);
window.__GONZO_HEALTH_RESPONSE_SEMANTICS__ = Object.freeze({ version: VERSION, nativeButtons: true });
