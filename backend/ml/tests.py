import json
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from apps.tasks.models import Task
from apps.projects.models import Project, Workspace
from apps.simulations.models import SimulationScenario
from ml.loader import ModelLoader
from ml.feature_builder import build_context_transfer_features, build_knowledge_transfer_features
from ml.predictor import predict_context_transfer, predict_knowledge_transfer

User = get_user_model()

class MLIntegrationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(username="TestUser", email="test@devcollab.io")
        self.candidate = User.objects.create(username="Candidate", email="smith@devcollab.io")
        self.workspace = Workspace.objects.create(name="Test Workspace", owner=self.user)
        self.project = Project.objects.create(name="Test Project", workspace=self.workspace)
        self.task = Task.objects.create(title="Test Task", project=self.project, assignee=self.user, status="In Progress")
        self.client = Client()

    def test_model_loading_metadata(self):
        # Verify metadata configuration
        meta = ModelLoader.get_metadata("context_transfer")
        self.assertEqual(meta["feature_version"], "v1")
        
        # Models should be loaded (scikit-learn 1.6.1 is required)
        model = ModelLoader.get_model("context_transfer")
        self.assertIsNotNone(model)
        self.assertTrue(hasattr(model, "predict"))

    def test_feature_builder_provenance_and_schema(self):
        features, provenance = build_context_transfer_features(self.task, self.candidate)
        
        # Check identifiers are stripped
        self.assertNotIn("task_id", features)
        self.assertNotIn("project_id", features)
        self.assertNotIn("developer_id", features)
        
        # Check outcome variables are excluded from inputs
        self.assertNotIn("transfer_effort_hours", features)
        
        # Check provenance
        self.assertEqual(provenance["task_type"], "SYNTHETIC_DEMO")
        self.assertEqual(provenance["task_progress"], "DERIVED")
        
        # Features count
        self.assertIn("task_complexity", features)
        self.assertIn("test_coverage", features)

    def test_predictor_execution(self):
        # predict_context_transfer strips provenance and executes
        result = predict_context_transfer(self.task, self.candidate)
        
        self.assertIn("prediction_hours", result)
        self.assertIsInstance(result["prediction_hours"], float)
        self.assertEqual(result["model"], "context_transfer_model")
        self.assertIn("provenance", result)

    def test_simulation_read_only_endpoint(self):
        url = reverse('evaluate-scenario')
        payload = {
            "task_id": self.task.id,
            "trigger": "INCIDENT",
            "candidate_ids": [self.candidate.id],
            "interventions": ["REASSIGN", "KNOWLEDGE_TRANSFER"]
        }
        
        response = self.client.post(url, data=json.dumps(payload), content_type="application/json")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("scenario_id", data)
        self.assertEqual(len(data["evaluation_results"]), 1)
        
        interventions = data["evaluation_results"][0]["interventions"]
        reassign = next(i for i in interventions if i["type"] == "REASSIGN")
        self.assertIn("predicted_transfer_effort_hours", reassign)

    def test_simulation_approve_action(self):
        scenario = SimulationScenario.objects.create(
            task=self.task,
            trigger="INCIDENT",
            results={"evaluation": []},
            status="EVALUATED"
        )
        
        url = reverse('approve-scenario', args=[scenario.id])
        payload = {
            "candidate_id": self.candidate.id,
            "intervention": "REASSIGN"
        }
        
        response = self.client.post(url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(response.status_code, 200)
        
        # Task should be reassigned
        self.task.refresh_from_db()
        self.assertEqual(self.task.assignee.id, self.candidate.id)
        
        # Scenario should be approved
        scenario.refresh_from_db()
        self.assertEqual(scenario.status, "APPROVED")
