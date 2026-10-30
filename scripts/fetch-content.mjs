// 把文档内容同步到 content/docs：内容与站点框架分仓时，在构建前跑一次。
//
// 三种来源，按优先级：
//   1. DOCS_CONTENT_DIR：本地已 checkout 的内容目录（CI 里两个仓库并排 checkout 时用）；
//   2. DOCS_CONTENT_REPO + DOCS_CONTENT_REF：从 GitHub 拉 tarball（没有本地副本时用）；
//   3. 两者都没设：沿用现有的 content/docs；它不存在时用仓库自带的 content.example/docs。
//
// content/docs 是构建产物，不入库；内容仓库的目录约定是 DOCS_CONTENT_SUBDIR，
// 默认 content/docs，里面必须有 meta.json 与至少一个 .mdx。
// GITHUB_TOKEN 只在仓库私有或触发限流时需要，值不打印。

import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const exampleSource = 'content.example/docs';
const dest = path.resolve(process.env.DOCS_CONTENT_DEST?.trim() || 'content/docs');
const localSource = process.env.DOCS_CONTENT_DIR?.trim();
const repo = process.env.DOCS_CONTENT_REPO?.trim();
const ref = process.env.DOCS_CONTENT_REF?.trim() || 'main';
const subdir = process.env.DOCS_CONTENT_SUBDIR?.trim() || 'content/docs';
const token = process.env.GITHUB_TOKEN?.trim();

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function assertContent(dir) {
  if (!(await exists(path.join(dir, 'meta.json')))) {
    throw new Error(`${dir} 不像内容目录：缺少 meta.json`);
  }
  const files = await readdir(dir, { recursive: true });
  if (!files.some((f) => f.endsWith('.mdx'))) {
    throw new Error(`${dir} 不像内容目录：没有任何 .mdx 页面`);
  }
}

async function replaceWith(source) {
  await assertContent(source);
  if (path.resolve(source) === dest) {
    console.log('内容来源就是 content/docs，无需同步');
    return;
  }
  await rm(dest, { recursive: true, force: true });
  await mkdir(path.dirname(dest), { recursive: true });
  await cp(source, dest, { recursive: true });
  const files = await readdir(dest, { recursive: true });
  console.log(`文档内容已同步：${dest}（${files.filter((f) => f.endsWith('.mdx')).length} 页）`);
}

async function fromLocal() {
  const source = path.resolve(localSource);
  if (!(await exists(source))) throw new Error(`DOCS_CONTENT_DIR 指向的目录不存在：${source}`);
  await replaceWith(source);
}

async function fromGitHub() {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    throw new Error(`DOCS_CONTENT_REPO 应写成 owner/repo，现在是 ${JSON.stringify(repo)}`);
  }

  const url = `https://api.github.com/repos/${repo}/tarball/${encodeURIComponent(ref)}`;
  const headers = { 'User-Agent': 'docs-site', Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  console.log(`从 GitHub 拉取文档内容：${repo}@${ref}`);
  const res = await fetch(url, { headers, redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`拉取 ${repo}@${ref} 失败：HTTP ${res.status}（私有仓库要设置 GITHUB_TOKEN）`);
  }

  const work = await mkdtemp(path.join(tmpdir(), 'docs-site-'));
  try {
    const tarball = path.join(work, 'content.tar.gz');
    await writeFile(tarball, Buffer.from(await res.arrayBuffer()));
    const extract = path.join(work, 'extract');
    await mkdir(extract);
    await execFileAsync('tar', ['-xzf', tarball, '-C', extract]);

    const [root] = await readdir(extract);
    if (!root) throw new Error('内容仓库的 tarball 是空的');
    const source = path.join(extract, root, subdir);
    if (!(await exists(source))) {
      throw new Error(`内容仓库里没有 ${subdir}；用 DOCS_CONTENT_SUBDIR 指定实际目录`);
    }
    await replaceWith(source);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

try {
  if (localSource) {
    await fromLocal();
  } else if (repo) {
    await fromGitHub();
  } else {
    if (await exists(path.join(dest, 'meta.json'))) {
      console.log('未设置 DOCS_CONTENT_DIR 与 DOCS_CONTENT_REPO，沿用现有 content/docs');
    } else if (await exists(path.join(exampleSource, 'meta.json'))) {
      console.log(`未设置内容来源，用仓库自带的 ${exampleSource}`);
      await replaceWith(exampleSource);
    } else {
      throw new Error(
        '未设置 DOCS_CONTENT_DIR 与 DOCS_CONTENT_REPO，content/docs 与 content.example/docs 都没有内容：设置内容来源',
      );
    }
  }
} catch (err) {
  console.error(`同步文档内容失败：${err.message}`);
  process.exit(1);
}
