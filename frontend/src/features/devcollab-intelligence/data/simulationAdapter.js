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
  let candidateIds = [];
  if (isLiveTask) {
    candidateIds = candidates.map(c => c.id).filter(id => id !== undefined && id !== null);
  } else {
    candidateIds = candidates.map(c => DEMO_USER_MAP[c.name] || DEMO_USER_MAP[c]).filter(id => id);
  }
  
  if (candidateIds.length === 0) {
    throw new Error('No valid candidates mapped for simulation.');
  }

  if (!isLiveTask) {
    // Isolated Demo Mode: Do not hit the backend. Return synthetic results.
    const mockData = {
      scenario_id: 'demo-scenario-1',
      task_id: taskId,
      evaluation_results: candidateIds.map(cId => ({
        candidate_id: cId,
        interventions: [
          {
            type: "WAIT",
            score: 0.2,
            estimated_completion: 6.0,
            risk: "MEDIUM",
            deadline_probability: 0.3,
            reason: ["Waiting adds dead time to delivery."]
          },
          {
            type: "REASSIGN",
            score: 0.8,
            estimated_completion: 4.5,
            risk: "LOW",
            deadline_probability: 0.8,
            predicted_transfer_effort_hours: 2.0,
            reason: ["Reassignment incurs full transfer cost."]
          },
          {
            type: "KNOWLEDGE_TRANSFER",
            score: 0.9,
            estimated_completion: 3.5,
            risk: "LOW",
            deadline_probability: 0.95,
            predicted_transfer_effort_hours: 2.0,
            predicted_transfer_effort_reduction_hours: 1.2,
            reason: ["Knowledge transfer significantly reduces effort."]
          }
        ]
      }))
    };
    return new Promise(resolve => setTimeout(() => resolve(formatSimulationResult(mockData, candidates, isLiveTask)), 800));
  }

  const payload = {
    task_id: taskId,
    trigger: trigger || 'MANUAL_EVALUATION',
    candidate_ids: candidateIds
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

export async function approveSimulation(scenarioId, candidateId, intervention) {
  if (!candidateId) {
    throw new Error(`Invalid candidate mapped for approval`);
  }

  // If scenarioId is a string like 'demo-scenario-1', it's a demo approval.
  if (typeof scenarioId === 'string' && scenarioId.startsWith('demo-')) {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Demo simulation approved successfully. No DB mutations were made." }), 500));
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

    return await response.json();
  } catch (err) {
    console.error('Approval Adapter Error:', err);
    throw err;
  }
}

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
        candidate_id: cId,
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
