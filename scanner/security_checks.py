import random

def run_security_scan():
    # Define a comprehensive list of potential security issues in a GCP context
    potential_findings = [
        {
            "resource_name": "gcp-firewall-allow-ssh",
            "resource_type": "Firewall rules",
            "severity": "HIGH",
            "description": "Firewall rule allows SSH (port 22) traffic from 0.0.0.0/0 (any IP address) to Google Compute instances. This exposes the SSH service to brute-force attacks.",
            "risk_score": 80
        },
        {
            "resource_name": "gcp-firewall-allow-mysql",
            "resource_type": "Firewall rules",
            "severity": "CRITICAL",
            "description": "Firewall rule allows MySQL (port 3306) traffic from 0.0.0.0/0 (any IP address) directly. This exposes the database service to unauthorized remote access.",
            "risk_score": 95
        },
        {
            "resource_name": "gcp-firewall-allow-postgresql",
            "resource_type": "Firewall rules",
            "severity": "CRITICAL",
            "description": "Firewall rule allows PostgreSQL (port 5432) traffic from 0.0.0.0/0 (any IP address) directly. This exposes the database service to unauthorized remote access.",
            "risk_score": 95
        },
        {
            "resource_name": "securesphere-prod-backups",
            "resource_type": "Storage buckets",
            "severity": "HIGH",
            "description": "Cloud Storage bucket has public access enabled via allUsers IAM role. This allows anyone on the internet to view or download backup files.",
            "risk_score": 90
        },
        {
            "resource_name": "user-profile-images",
            "resource_type": "Storage buckets",
            "severity": "MEDIUM",
            "description": "Cloud Storage bucket does not have encryption enabled using Customer-Managed Encryption Keys (CMEK). It relies on default Google-managed keys.",
            "risk_score": 45
        },
        {
            "resource_name": "billing-invoices-2024",
            "resource_type": "Storage buckets",
            "severity": "LOW",
            "description": "Cloud Storage bucket does not have Object Versioning enabled. If an object is overwritten or deleted, the previous version cannot be recovered.",
            "risk_score": 15
        },
        {
            "resource_name": "developer-temp@securesphere-prod.iam.gserviceaccount.com",
            "resource_type": "IAM accounts",
            "severity": "HIGH",
            "description": "IAM user has been assigned the primitive Owner role. It is recommended to use predefined or custom IAM roles instead to follow the principle of least privilege.",
            "risk_score": 85
        },
        {
            "resource_name": "legacy-report-generator@securesphere-prod.iam.gserviceaccount.com",
            "resource_type": "IAM accounts",
            "severity": "MEDIUM",
            "description": "Service account has been inactive for the last 90 days but remains enabled with broad permissions. Unused service accounts increase the attack surface.",
            "risk_score": 50
        },
        {
            "resource_name": "api-gateway-vm",
            "resource_type": "Compute instances",
            "severity": "MEDIUM",
            "description": "Compute Engine instance is configured with a public external IP address. The instance should be placed behind a load balancer or Cloud NAT.",
            "risk_score": 60
        },
        {
            "resource_name": "worker-node-3",
            "resource_type": "Compute instances",
            "severity": "LOW",
            "description": "Compute Engine instance is missing the Cloud Monitoring agent. This prevents capturing deep system-level telemetry and host metrics.",
            "risk_score": 25
        },
        {
            "resource_name": "postgres-db-main",
            "resource_type": "Cloud SQL",
            "severity": "HIGH",
            "description": "Cloud SQL instance has a public IP address enabled. Access should be restricted to private IP using VPC peering or Cloud SQL Auth Proxy.",
            "risk_score": 88
        },
        {
            "resource_name": "postgres-db-backup-disabled",
            "resource_type": "Cloud SQL",
            "severity": "HIGH",
            "description": "Cloud SQL instance has automated backups disabled. In the event of data corruption or instance failure, data recovery will be impossible.",
            "risk_score": 75
        }
    ]

    # Select a random subset (between 5 and 9 findings)
    num_findings = random.randint(5, 9)
    selected_findings = random.sample(potential_findings, num_findings)
    return selected_findings
