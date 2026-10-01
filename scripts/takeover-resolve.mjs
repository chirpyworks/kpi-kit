import fs from 'node:fs';

const [, , standardPath, jobPath, outputPath] = process.argv;
if (!standardPath || !jobPath || !outputPath) {
  console.error('Usage: node scripts/takeover-resolve.mjs <standard.json> <job.json> <output.json>');
  process.exit(2);
}
const standard = JSON.parse(fs.readFileSync(standardPath, 'utf8'));
const job = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
const scopes = new Set(job.scopes ?? []);
const selected = standard.items.filter((item) => {
  if (item.status !== 'ACTIVE') return false;
  if (item.priority === 'BLOCKING' && item.scope === 'release' && scopes.has('release')) return true;
  return scopes.has(item.scope);
});
const manifest = {
  job_id: job.job_id,
  project_id: job.project_id,
  standard_version: standard.standard_version,
  input: job.input,
  input_contains_selected_rule_text: selected.some((item) =>
    String(job.input).toLowerCase().includes(String(item.statement).toLowerCase())
  ),
  selected_standard_items: selected.map(({standard_item_id,type,priority,scope,statement,source_type,source_ref}) => ({
    standard_item_id,type,priority,scope,statement,source_type,source_ref
  }))
};
fs.mkdirSync(new URL('../artifacts/', import.meta.url), {recursive:true});
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
