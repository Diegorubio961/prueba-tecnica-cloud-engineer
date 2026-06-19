"""
Governance Audit Script — AWS S3 Buckets
Liberty Latin America — Cloud Engineer Technical Test

Checks all S3 buckets in a specified region for:
  - Versioning enabled
  - Default encryption enabled at the bucket level

Prints a compliance report with three categories:
  1. Compliant: both controls enabled
  2. No versioning: versioning not enabled (may overlap with #3)
  3. No encryption: default encryption not configured (may overlap with #2)
"""

import boto3
from botocore.exceptions import ClientError, NoCredentialsError

REGION = "us-east-1"


def get_s3_client(region: str):
    return boto3.client("s3", region_name=region)


def get_buckets_in_region(s3_client, region: str) -> list[str]:
    """Return bucket names whose location matches the target region."""
    response = s3_client.list_buckets()
    all_buckets = [b["Name"] for b in response.get("Buckets", [])]

    buckets_in_region = []
    for name in all_buckets:
        try:
            loc = s3_client.get_bucket_location(Bucket=name)
            bucket_region = loc.get("LocationConstraint") or "us-east-1"
            if bucket_region == region:
                buckets_in_region.append(name)
        except ClientError as e:
            code = e.response["Error"]["Code"]
            if code in ("AccessDenied", "NoSuchBucket"):
                print(f"  [SKIP] {name}: {code}")
            else:
                raise
    return buckets_in_region


def check_versioning(s3_client, bucket_name: str) -> bool:
    """Return True if versioning is Enabled on the bucket."""
    try:
        response = s3_client.get_bucket_versioning(Bucket=bucket_name)
        return response.get("Status", "") == "Enabled"
    except ClientError as e:
        print(f"  [WARN] Could not check versioning for {bucket_name}: {e}")
        return False


def check_encryption(s3_client, bucket_name: str) -> bool:
    """Return True if a default encryption rule is configured on the bucket."""
    try:
        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = (
            response.get("ServerSideEncryptionConfiguration", {})
            .get("Rules", [])
        )
        return len(rules) > 0
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code == "ServerSideEncryptionConfigurationNotFoundError":
            return False
        print(f"  [WARN] Could not check encryption for {bucket_name}: {e}")
        return False


def audit_buckets(region: str) -> dict:
    """
    Run governance audit and return results in three categories:
    - compliant: both versioning AND encryption enabled
    - no_versioning: versioning NOT enabled (independent of encryption status)
    - no_encryption: encryption NOT enabled (independent of versioning status)

    A bucket that fails both controls will appear in both no_versioning and
    no_encryption lists, matching the report structure required.
    """
    s3 = get_s3_client(region)

    print(f"\n{'='*60}")
    print(f"  AWS S3 Governance Audit — Region: {region}")
    print(f"{'='*60}")
    print(f"\nDiscovering buckets in region '{region}'...\n")

    buckets = get_buckets_in_region(s3, region)
    print(f"Found {len(buckets)} bucket(s) in {region}.\n")

    compliant     = []
    no_versioning = []
    no_encryption = []

    for name in buckets:
        versioned = check_versioning(s3, name)
        encrypted = check_encryption(s3, name)

        if versioned and encrypted:
            compliant.append(name)
        if not versioned:
            no_versioning.append(name)
        if not encrypted:
            no_encryption.append(name)

    return {
        "compliant":     compliant,
        "no_versioning": no_versioning,
        "no_encryption": no_encryption,
        "total":         len(buckets),
    }


def print_report(results: dict, region: str):
    """Print a formatted governance compliance report."""
    compliant     = results["compliant"]
    no_versioning = results["no_versioning"]
    no_encryption = results["no_encryption"]
    total         = results["total"]
    non_compliant = total - len(compliant)

    print(f"\n{'='*60}")
    print(f"  GOVERNANCE COMPLIANCE REPORT — S3 / {region}")
    print(f"{'='*60}\n")

    print(f"  Total buckets audited : {total}")
    print(f"  Fully compliant       : {len(compliant)}")
    print(f"  Non-compliant         : {non_compliant}\n")

    # Compliant
    print(f"{'─'*60}")
    print(f"  ✅ COMPLIANT (versioning + encryption enabled): {len(compliant)}")
    print(f"{'─'*60}")
    if compliant:
        for name in compliant:
            print(f"    • {name}")
    else:
        print("    (none)")

    # Missing versioning
    print(f"\n{'─'*60}")
    print(f"  ⚠️  NO VERSIONING ENABLED: {len(no_versioning)}")
    print(f"{'─'*60}")
    if no_versioning:
        for name in no_versioning:
            print(f"    • {name}")
    else:
        print("    (none)")

    # Missing encryption
    print(f"\n{'─'*60}")
    print(f"  ⚠️  NO DEFAULT ENCRYPTION ENABLED: {len(no_encryption)}")
    print(f"{'─'*60}")
    if no_encryption:
        for name in no_encryption:
            print(f"    • {name}")
    else:
        print("    (none)")

    print(f"\n{'='*60}\n")
    if no_versioning or no_encryption:
        print("  Action required: remediate flagged buckets to meet governance standards.\n")


def main():
    try:
        results = audit_buckets(REGION)
        print_report(results, REGION)
    except NoCredentialsError:
        print(
            "\n[ERROR] AWS credentials not found.\n"
            "Run 'aws configure' or set environment variables:\n"
            "  AWS_ACCESS_KEY_ID\n"
            "  AWS_SECRET_ACCESS_KEY\n"
            "  AWS_DEFAULT_REGION\n"
        )
    except ClientError as e:
        print(f"\n[ERROR] AWS API error: {e}")


if __name__ == "__main__":
    main()
