import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const args = process.argv.slice(2);
  const slugIdx = args.indexOf('--slug');
  const byIdx = args.indexOf('--by');
  const notesIdx = args.indexOf('--notes');
  if (slugIdx < 0 || byIdx < 0 || !args[slugIdx + 1] || !args[byIdx + 1]) {
    console.error('Usage: --slug <slug> --by <name> [--notes "text"]');
    process.exit(1);
  }
  const slug = args[slugIdx + 1];
  const by = args[byIdx + 1];
  const notes = notesIdx >= 0 ? args[notesIdx + 1] || '' : '';

  const approval = {
    approved: true,
    approvedBy: by,
    approvedAt: new Date().toISOString(),
    notes,
  };

  const dir = path.join(process.cwd(), 'review', 'approvals');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${slug}.json`), JSON.stringify(approval, null, 2), 'utf8');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
