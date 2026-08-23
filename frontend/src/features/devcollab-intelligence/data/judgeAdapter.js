/**
 * judgeAdapter.js
 * 
 * Source extraction adapter for DevCollab Intelligence Judge Mode.
 * It simulates a backend ingestion layer by connecting directly to public
 * source endpoints (GitHub REST API) without storing or requiring auth tokens.
 */

const delay = (ms) => new Promise(res => setTimeout(res, ms));

export async function extractGitHubOwnerRepo(url) {
  try {
    const u = new URL(url);
    if (u.hostname !== 'github.com') return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
    return null;
  } catch (e) {
    return null;
  }
}

export async function analyzeGitHubRepository(url) {
  const parsed = await extractGitHubOwnerRepo(url);
  if (!parsed) {
    throw new Error('INVALID_URL');
  }

  const { owner, repo } = parsed;

  try {
    // We intentionally fetch public data without tokens to prove architecture
    // isolation without leaking secrets to the frontend.
    const [repoRes, contributorsRes, commitsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`),
      fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=10`),
      fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`)
    ]);

    if (repoRes.status === 404) throw new Error('NOT_FOUND_OR_PRIVATE');
    if (repoRes.status === 403) throw new Error('RATE_LIMITED');
    if (!repoRes.ok) throw new Error('FETCH_FAILED');

    const repoData = await repoRes.json();
    const contributorsData = contributorsRes.ok ? await contributorsRes.json() : [];
    const commitsData = commitsRes.ok ? await commitsRes.json() : [];

    // Map GitHub data to the normalized DevCollab engineering state structure
    const normalizedState = {
      source: 'GITHUB_LIVE',
      metadata: {
        name: repoData.full_name,
        branch: repoData.default_branch,
        language: repoData.language || 'Multiple',
        stars: repoData.stargazers_count,
        openIssues: repoData.open_issues_count,
      },
      projects: [
        {
          id: 'repo-core',
          name: repoData.name,
          source: 'repository structure',
          provenance: 'REAL_GITHUB'
        }
      ],
      members: contributorsData.map(c => ({
        id: c.login,
        name: c.login,
        avatar: c.avatar_url,
        contributions: c.contributions,
        provenance: 'REAL_GITHUB'
      })),
      tasks: [
        // Represent the high-level issue count as a task metric since we don't fetch all issues
        {
          id: 'gh-issues',
          title: `${repoData.open_issues_count} open issues`,
          status: 'ACTIVE',
          provenance: 'REAL_GITHUB'
        }
      ],
      activity: commitsData.map(c => ({
        id: c.sha,
        message: c.commit.message,
        author: c.commit.author.name,
        date: c.commit.author.date,
        provenance: 'REAL_GITHUB'
      })),
      dependencies: [
        { name: 'Core Modules', relation: 'internal', provenance: 'DERIVED' }
      ],
      coverage: {
        structure: 'AVAILABLE',
        contributors: 'AVAILABLE',
        commitActivity: 'AVAILABLE',
        issues: repoData.has_issues ? 'AVAILABLE' : 'UNAVAILABLE',
        moduleRelationships: 'DERIVED',
        availability: 'UNAVAILABLE',
        workload: 'UNAVAILABLE',
        deadlines: 'UNAVAILABLE',
        responsibilities: 'DERIVED',
        incidentState: 'UNAVAILABLE'
      }
    };

    return normalizedState;
  } catch (error) {
    if (error.message.includes('NOT_FOUND') || error.message.includes('RATE_LIMITED') || error.message.includes('INVALID_URL')) {
      throw error;
    }
    throw new Error('UNKNOWN_ERROR');
  }
}

export async function getDemoScenarioSource() {
  await delay(1000);
  return {
    source: 'SYNTHETIC_DEMO',
    metadata: {
      name: 'Payments Demo Scenario',
      branch: 'main',
      language: 'TypeScript',
      stars: 0,
      openIssues: 21,
    },
    projects: [
      { id: 'p1', name: 'Payments', provenance: 'SYNTHETIC_DEMO' },
      { id: 'p2', name: 'Gateway', provenance: 'SYNTHETIC_DEMO' }
    ],
    members: [
      { id: 'm1', name: 'Smith', contributions: 142, provenance: 'SYNTHETIC_DEMO' },
      { id: 'm2', name: 'Rahul', contributions: 89, provenance: 'SYNTHETIC_DEMO' },
      { id: 'm3', name: 'Elena', contributions: 310, provenance: 'SYNTHETIC_DEMO' }
    ],
    tasks: [
      { id: 'dp1', title: 'Payment gateway retry', status: 'BLOCKED', provenance: 'SYNTHETIC_DEMO' }
    ],
    activity: [
      { id: 'c1', message: 'Add exponential backoff', author: 'Smith', date: new Date().toISOString(), provenance: 'SYNTHETIC_DEMO' }
    ],
    dependencies: [
      { name: 'Payments -> Gateway', relation: 'upstream', provenance: 'SYNTHETIC_DEMO' }
    ],
    coverage: {
      structure: 'AVAILABLE',
      contributors: 'AVAILABLE',
      commitActivity: 'AVAILABLE',
      issues: 'AVAILABLE',
      moduleRelationships: 'AVAILABLE',
      availability: 'AVAILABLE',
      workload: 'AVAILABLE',
      deadlines: 'PARTIAL',
      responsibilities: 'AVAILABLE',
      incidentState: 'AVAILABLE'
    }
  };
}
