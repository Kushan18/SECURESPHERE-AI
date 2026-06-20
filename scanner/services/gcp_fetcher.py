import os
from google.cloud import storage, compute_v1, sqladmin_v1beta4, logging_v2
from typing import List, Dict

# Load service account key path from environment
SERVICE_ACCOUNT_PATH = os.getenv('GCP_SERVICE_ACCOUNT_PATH', 'gcp_service_account.json')

# Initialize clients
storage_client = storage.Client.from_service_account_json(SERVICE_ACCOUNT_PATH)
compute_client = compute_v1.InstancesClient.from_service_account_json(SERVICE_ACCOUNT_PATH)
sql_admin_client = sqladmin_v1beta4.SqlInstancesServiceClient.from_service_account_json(SERVICE_ACCOUNT_PATH)
logging_client = logging_v2.LoggingServiceV2Client.from_service_account_json(SERVICE_ACCOUNT_PATH)

def list_buckets() -> List[Dict]:
    """Return a list of GCP storage buckets with basic metadata."""
    buckets = storage_client.list_buckets()
    return [{"name": b.name, "location": b.location, "storage_class": b.storage_class} for b in buckets]

def list_firewalls(project_id: str) -> List[Dict]:
    """Return firewall rules for a given project."""
    firewalls_client = compute_v1.FirewallsClient.from_service_account_json(SERVICE_ACCOUNT_PATH)
    firewalls = firewalls_client.list(project=project_id)
    return [{"name": fw.name, "direction": fw.direction, "priority": fw.priority, "allowed": [a.ip_protocol for a in fw.allowed]} for fw in firewalls]

def list_instances(project_id: str, zone: str) -> List[Dict]:
    """Return compute VM instances for a given zone."""
    instances = compute_client.list(project=project_id, zone=zone)
    return [{"name": i.name, "machine_type": i.machine_type, "status": i.status} for i in instances]

def list_iam_members(project_id: str) -> List[Dict]:
    """Return IAM members (users, service accounts) for a project."""
    # Using Cloud Resource Manager API would be ideal; here we mock a simple call.
    # For real implementation, install google-cloud-resourcemanager.
    return []  # Placeholder – actual implementation would query IAM policies.

def list_cloud_sql_instances(project_id: str) -> List[Dict]:
    """Return Cloud SQL instances for a project."""
    instances = sql_admin_client.list(project=project_id)
    return [{"name": i.name, "region": i.region, "database_version": i.database_version} for i in instances]

def list_logging_sinks(project_id: str) -> List[Dict]:
    """Return Cloud Logging sinks for a project."""
    sinks = logging_client.list_sinks(parent=f"projects/{project_id}")
    return [{"name": s.name, "destination": s.destination, "filter": s.filter} for s in sinks]
