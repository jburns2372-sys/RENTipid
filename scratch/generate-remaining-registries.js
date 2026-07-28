const fs = require('fs');

const registries = [
  { id: '02', name: 'Module-Feature-Registry', columns: '| Feature ID | Domain | Module Name | Status |' },
  { id: '04', name: 'Role-Permission-Registry', columns: '| Role | Description | Allowed Actions | Restricted Actions |' },
  { id: '07', name: 'Integration-Registry', columns: '| Integration | Purpose | Status | Required Config |' },
  { id: '08', name: 'Environment-Variable-Registry', columns: '| Variable | Purpose | Required | Environment |' },
  { id: '09', name: 'Workflow-State-Transition-Registry', columns: '| Entity | From State | To State | Trigger | Actor |' },
  { id: '10', name: 'Audit-Event-Registry', columns: '| Event Code | Trigger | Actor | Target | Relevance |' },
  { id: '11', name: 'Security-Control-Registry', columns: '| Control ID | Description | Enforcement Point | Status |' },
  { id: '12', name: 'Test-Evidence-Registry', columns: '| Test Suite | Target Module | Type | Status |' },
  { id: '13', name: 'Phase-Completion-Registry', columns: '| Phase ID | Objective | Completion Date | Status |' },
  { id: '14', name: 'Known-Gap-Limitation-Registry', columns: '| Gap ID | Domain | Description | Impact | Recommendation |' },
  { id: '15', name: 'Documentation-Traceability-Matrix', columns: '| Req ID | Feature | Registry Link | Code Evidence | Status |' }
];

registries.forEach(reg => {
  const content = `# ${reg.id} ${reg.name.replace(/-/g, ' ')}\n\n${reg.columns}\n| --- | --- | --- | --- |\n| (Pending) | | | |\n`;
  fs.writeFileSync(`docs/RENTipid-Master-Manual/17-Registries/${reg.id}-${reg.name}.md`, content);
});

console.log('Created remaining registry placeholders.');
