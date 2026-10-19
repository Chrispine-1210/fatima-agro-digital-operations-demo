import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
test('release excludes private source packs, local session secrets and runtime state',async()=>{const s=await readFile(new URL('.gitignore',root),'utf8');for(const pattern of ['/client-pack/','*.docx','*.pdf','.env*','/.dev.vars','/.wrangler/'])assert.ok(s.includes(pattern),pattern);const env=await readFile(new URL('.env.example',root),'utf8');assert.doesNotMatch(env,/fagrodealers@gmail.com|FATIMA_LOCAL_SESSION_SECRET\s*=\s*[^\s#]/);});
test('hosting declares durable DB and preserves existing Site identity',async()=>{const h=JSON.parse(await readFile(new URL('.openai/hosting.json',root),'utf8'));assert.equal(h.d1,'DB');assert.equal(h.project_id,'appgprj_6a933c8c00088191985d3193e64e72d5');assert.equal(h.r2,null);});
