/* ── Report Issue Modal ────────────────────────────────────────────────── */

const GITHUB_REPO = 'michellemli/unwind';

const ISSUE_TYPE_LABELS = {
  'missing-event': 'missing event',
  'wrong-info':    'wrong info',
  'broken-link':   'broken link',
  'suggestion':    'suggestion',
  'other':         '',
};

const ISSUE_TYPE_TITLES = {
  'missing-event': 'Missing event: ',
  'wrong-info':    'Wrong info: ',
  'broken-link':   'Broken link: ',
  'suggestion':    'Suggestion: ',
  'other':         '',
};

function openModal() {
  const backdrop = document.getElementById('issueModalBackdrop');
  backdrop.hidden = false;
  document.getElementById('issueSummary').focus();
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const backdrop = document.getElementById('issueModalBackdrop');
  backdrop.hidden = true;
  document.body.style.overflow = '';
  document.getElementById('issueForm').reset();
}

function buildGitHubUrl(type, summary, details) {
  const typePrefix = ISSUE_TYPE_TITLES[type] ?? '';
  const label      = ISSUE_TYPE_LABELS[type];

  const title = typePrefix + summary;

  const bodyLines = [];
  if (type && type !== 'other') {
    bodyLines.push(`**Type:** ${type.replace('-', ' ')}`);
  }
  if (details.trim()) {
    bodyLines.push('', '**Details:**', details.trim());
  }
  bodyLines.push('', '---', '_Submitted via the Girls Just Want to Unwind site_');

  const params = new URLSearchParams({ title, body: bodyLines.join('\n') });
  if (label) params.set('labels', label);

  return `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}`;
}

function handleSubmit(e) {
  e.preventDefault();

  const type    = document.getElementById('issueType').value;
  const summary = document.getElementById('issueSummary').value.trim();
  const details = document.getElementById('issueDetails').value;

  if (!summary) {
    document.getElementById('issueSummary').focus();
    return;
  }

  const url = buildGitHubUrl(type, summary, details);
  window.open(url, '_blank', 'noopener,noreferrer');
  closeModal();
}

function init() {
  document.getElementById('openIssueModal').addEventListener('click', openModal);
  document.getElementById('issueModalClose').addEventListener('click', closeModal);
  document.getElementById('issueForm').addEventListener('submit', handleSubmit);

  // Close on backdrop click
  document.getElementById('issueModalBackdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('issueModalBackdrop').hidden) {
      closeModal();
    }
  });
}

init();
