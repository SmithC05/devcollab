/**
 * DevCollab Intelligence — Simulation Data Adapter
 * Bridges the frontend isolated UI with the backend simulation engine.
 */

const DEMO_TASK_MAP = {
  'dp1': 1,
  'dp2': 1,
  'dp3': 1
};

const DEMO_USER_MAP = {
  'Smith': 1,
  'Rahul': 2,
  'Ankush': 3,
  'Riya': 4,
  'Karthik': 5
};

export async function fetchSimulation(decisionId, trigger, candidates) {
  // If decisionId is numeric, it's a live task. Otherwise, map demo UI decision IDs.
  const isLiveTask = !isNaN(decisionId);
  const taskId = isLiveTask ? parseInt(decisionId, 10) : (DEMO_TASK_MAP[decisionId] || 1);
  
  // Candidates is now expected to be an array of objects {id, name}
  // For live tasks we extract IDs. For demo, we fallback to names mapped to IDs.
  let candidateIds = [];
  if (isLiveTask) {
    candidateIds = candidates.map(c => c.id);
  } else {
    candidateIds = candidates.map(c => DEMO_USER_MAP[c.name] || DEMO_USER_MAP[c]).filter(id => id);
  }
  
  if (candidateIds.length === 0) {
    throw new Error('No valid candidates mapped for simulation.');
  }

  const payload = {
    task_id: taskId,
    trigger: trigger || 'MANUAL_EVALUATION',
    candidate_ids: candidateIds,
    // Phase 3: Pass unavailable member for stale-state validation
    unavailable_member_id: candidates.find?.(c => c.unavailable_member_id)?.unavailable_member_id || null,
    duration_hours: 72, // default for Phase 3 scenario
  };

  try {
    const token = localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('http://localhost:8000/api/simulations/evaluate/', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Simulation failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return formatSimulationResult(data, candidates, isLiveTask);
  } catch (err) {
    console.error('Simulation Adapter Error:', err);
    throw err;
  }
}

export async function approveSimulation(scenarioId, candidateName, intervention) {
  // For live tasks: if candidateName is a numeric ID, use it directly
  const candidateId = isNaN(candidateName)
    ? DEMO_USER_MAP[candidateName]
    : parseInt(candidateName, 10);

  if (!candidateId) {
    throw new Error(`Invalid candidate mapped for approval: ${candidateName}`);
  }

  const payload = {
    candidate_id: candidateId,
    intervention: intervention
  };

  try {
    const token = localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`http://localhost:8000/api/simulations/${scenarioId}/approve/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 400 || response.status === 404 || response.status === 409) {
         throw new Error(JSON.parse(errorText).error || 'Simulation could not be approved.');
      }
      throw new Error(`Approval failed: ${response.status}`);
    }

    const data = await response.json();

    // Phase 3 fallback: if task_data is returned, update the Kanban store immediately
    // (in case WebSocket broadcast is delayed or misses)
    if (data.task_data) {
      setTimeout(() => {
        import('../../../stores/taskStore').then(({ useTaskStore }) => {
          useTaskStore.getState().syncEngineEvent({
            event_type: 'TASK_REASSIGNED',
            task_data: data.task_data,
            task_id: data.task_data.id,
            new_assignee_id: data.new_assignee?.id,
          });
        }).catch(() => {});
      }, 3000); // 3s fallback window — WS should fire before this
    }

    return data;
  } catch (err) {
    console.error('Approval Adapter Error:', err);
    throw err;
  }
}

/**
 * Transforms the backend response into the format expected by SimulationResults.jsx.
 * Also appends a derived 'recommended' flag based on backend heuristic output.
 */
function formatSimulationResult(data, candidates, isLiveTask) {
  let allInterventions = [];
  
  data.evaluation_results.forEach(candResult => {
    const cId = candResult.candidate_id;
    let cName = `Candidate ${cId}`;
    if (isLiveTask) {
       const candObj = candidates.find(c => c.id === cId);
       if (candObj) cName = candObj.name;
    } else {
       cName = Object.keys(DEMO_USER_MAP).find(k => DEMO_USER_MAP[k] === cId) || cName;
    }
    
    candResult.interventions.forEach(inv => {
      allInterventions.push({
        candidate_name: cName,
        ...inv
      });
    });
  });
  
  let recommended = null;
  let bestScore = Infinity;

  // Prefer REASSIGN + KNOWLEDGE TRANSFER for the demo to match instructions.
  // We rank strictly based on backend output combinations (duration + risk penalty).
  allInterventions.forEach(inv => {
    let score = inv.estimated_completion;
    if (inv.risk === 'HIGH') score += 100;
    if (inv.risk === 'MEDIUM') score += 20;
    
    if (score < bestScore) {
      bestScore = score;
      recommended = inv;
    }
  });

  if (recommended) {
    recommended.is_recommended = true;
  }

  return {
    scenario_id: data.scenario_id,
    task_id: data.task_id,
    interventions: allInterventions,
    recommended
  };
}
