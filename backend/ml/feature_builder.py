import random
from typing import Dict, Any, Tuple

# We generate deterministic synthetic values seeded by stable entity IDs for missing data
def _synthetic(task_id: int, user_id: int, key: str, min_val: float, max_val: float, is_int: bool = False):
    rng = random.Random(f"{task_id}_{user_id}_{key}")
    if is_int:
        return rng.randint(int(min_val), int(max_val))
    return round(rng.uniform(min_val, max_val), 2)

def build_context_transfer_features(task, candidate) -> Tuple[Dict[str, Any], Dict[str, str]]:
    """
    Constructs the feature payload required for the context transfer model.
    Returns:
        features (dict): The feature values to be passed to the model.
        provenance (dict): Mapping of feature names to their data source (REAL_DB, DERIVED, SYNTHETIC_DEMO).
    """
    t_id = task.id
    u_id = candidate.id
    
    features = {}
    provenance = {}
    
    def add_feat(name, value, prov):
        features[name] = value
        provenance[name] = prov

    # Categorical
    # Use DERIVED for role_level based on email to maintain demo personality, else SYNTHETIC
    if "smith" in candidate.email.lower():
        role = "Senior"
    elif "rahul" in candidate.email.lower():
        role = "Mid"
    else:
        role = "Junior"
    
    add_feat("role_level", role, "DERIVED")
    add_feat("task_type", "Feature", "SYNTHETIC_DEMO")  # Not currently in DB
    add_feat("codebase_size", "Medium", "SYNTHETIC_DEMO")

    # Numeric - Derived from DB
    add_feat("task_progress", 0.5 if task.status == 'In Progress' else (1.0 if task.status == 'Done' else 0.0), "DERIVED")
    add_feat("remaining_work_fraction", max(0.0, 1.0 - features["task_progress"]), "DERIVED")
    
    # Numeric - Synthetic Fallbacks
    add_feat("years_experience", _synthetic(t_id, u_id, "years", 1, 10, True), "SYNTHETIC_DEMO")
    add_feat("technology_familiarity", _synthetic(t_id, u_id, "tech_fam", 0.1, 1.0), "SYNTHETIC_DEMO")
    add_feat("project_familiarity", _synthetic(t_id, u_id, "proj_fam", 0.1, 1.0), "SYNTHETIC_DEMO")
    add_feat("repository_familiarity", _synthetic(t_id, u_id, "repo_fam", 0.1, 1.0), "SYNTHETIC_DEMO")
    add_feat("architecture_familiarity", _synthetic(t_id, u_id, "arch_fam", 0.1, 1.0), "SYNTHETIC_DEMO")
    add_feat("similar_task_count", _synthetic(t_id, u_id, "similar", 0, 20, True), "SYNTHETIC_DEMO")
    add_feat("task_complexity", _synthetic(t_id, u_id, "complexity", 0.1, 1.0), "SYNTHETIC_DEMO")
    
    add_feat("dependency_count", _synthetic(t_id, u_id, "dep_count", 0, 5, True), "SYNTHETIC_DEMO")
    add_feat("dependency_familiarity", _synthetic(t_id, u_id, "dep_fam", 0.0, 1.0), "SYNTHETIC_DEMO")
    add_feat("documentation_quality", _synthetic(t_id, u_id, "doc_qual", 0.2, 0.9), "SYNTHETIC_DEMO")
    add_feat("comment_context_quality", _synthetic(t_id, u_id, "cmt_qual", 0.2, 0.9), "SYNTHETIC_DEMO")
    
    add_feat("previous_owner_context", _synthetic(t_id, u_id, "prev_ctx", 0.1, 1.0), "SYNTHETIC_DEMO")
    add_feat("ownership_changes_before", _synthetic(t_id, u_id, "own_chg", 0, 3, True), "SYNTHETIC_DEMO")
    add_feat("handoff_quality", _synthetic(t_id, u_id, "handoff", 0.1, 0.9), "SYNTHETIC_DEMO")
    
    add_feat("current_workload_hours", _synthetic(t_id, u_id, "workload", 0, 40), "SYNTHETIC_DEMO")
    add_feat("concurrent_task_count", _synthetic(t_id, u_id, "concurrent", 1, 5, True), "SYNTHETIC_DEMO")
    add_feat("hours_until_deadline", _synthetic(t_id, u_id, "deadline", 10, 100), "SYNTHETIC_DEMO")
    add_feat("test_coverage", _synthetic(t_id, u_id, "tests", 0.3, 0.95), "SYNTHETIC_DEMO")
    add_feat("task_volatility", _synthetic(t_id, u_id, "volatile", 0.1, 0.8), "SYNTHETIC_DEMO")
    
    return features, provenance


def build_knowledge_transfer_features(task, candidate) -> Tuple[Dict[str, Any], Dict[str, str]]:
    """
    Constructs the feature payload required for the knowledge transfer model.
    """
    t_id = task.id
    u_id = candidate.id
    
    features = {}
    provenance = {}
    
    def add_feat(name, value, prov):
        features[name] = value
        provenance[name] = prov

    # Categorical
    add_feat("task_type", "Feature", "SYNTHETIC_DEMO")
    add_feat("codebase_size", "Medium", "SYNTHETIC_DEMO")

    # Numeric - Derived from DB
    add_feat("task_progress", 0.5 if task.status == 'In Progress' else (1.0 if task.status == 'Done' else 0.0), "DERIVED")
    
    # Numeric - Synthetic Fallbacks
    add_feat("task_complexity", _synthetic(t_id, u_id, "complexity", 0.1, 1.0), "SYNTHETIC_DEMO")
    add_feat("dependency_count", _synthetic(t_id, u_id, "dep_count", 0, 5, True), "SYNTHETIC_DEMO")
    add_feat("technology_familiarity", _synthetic(t_id, u_id, "tech_fam", 0.1, 1.0), "SYNTHETIC_DEMO")
    add_feat("project_familiarity", _synthetic(t_id, u_id, "proj_fam", 0.1, 1.0), "SYNTHETIC_DEMO")
    add_feat("repository_familiarity", _synthetic(t_id, u_id, "repo_fam", 0.1, 1.0), "SYNTHETIC_DEMO")
    add_feat("architecture_familiarity", _synthetic(t_id, u_id, "arch_fam", 0.1, 1.0), "SYNTHETIC_DEMO")
    add_feat("dependency_familiarity", _synthetic(t_id, u_id, "dep_fam", 0.0, 1.0), "SYNTHETIC_DEMO")
    add_feat("previous_owner_context", _synthetic(t_id, u_id, "prev_ctx", 0.1, 1.0), "SYNTHETIC_DEMO")
    
    # Handoff specific synthetic features
    add_feat("architecture_coverage", _synthetic(t_id, u_id, "arch_cov", 0.4, 1.0), "SYNTHETIC_DEMO")
    add_feat("important_files_coverage", _synthetic(t_id, u_id, "file_cov", 0.4, 1.0), "SYNTHETIC_DEMO")
    add_feat("known_issues_coverage", _synthetic(t_id, u_id, "issue_cov", 0.3, 1.0), "SYNTHETIC_DEMO")
    add_feat("debugging_guidance_quality", _synthetic(t_id, u_id, "dbg_qual", 0.3, 1.0), "SYNTHETIC_DEMO")
    add_feat("recent_decisions_coverage", _synthetic(t_id, u_id, "dec_cov", 0.2, 1.0), "SYNTHETIC_DEMO")
    add_feat("testing_guidance_quality", _synthetic(t_id, u_id, "test_qual", 0.3, 1.0), "SYNTHETIC_DEMO")
    add_feat("deployment_guidance_quality", _synthetic(t_id, u_id, "deploy_qual", 0.3, 1.0), "SYNTHETIC_DEMO")
    add_feat("handoff_completeness", _synthetic(t_id, u_id, "handoff_comp", 0.5, 1.0), "SYNTHETIC_DEMO")
    
    return features, provenance
