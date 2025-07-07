# EKS

## Credentials

`bootstrap_cluster_creator_admin_permissions = true`

This setting will create admin user in EKS cluster with identity od Terraform AWS user.

Update kubeconfig with new cluster:

```sh
aws eks update-kubeconfig --region eu-central-1 --name eks-demo --profile aws_profile_name

kubectl config view --minify
```

Check permissions:

```sh
kubectl auth can-i "*" "*"
yes # you're admin

kubectl auth con-i get pods
```

### Users

Create common role and give specific users permisions to assume that role.

For devs you can create read/write roles limited to specific Namespace. You can also create `ResourceQuota` to limit this users amount of CPUs, PODs or memory.

AWS:

- IAM users
- IAM roles

Kubernetes:

- Service Accounts
- Users
- RBAC groups

## Examples

### Cluster Viewer role

```yaml
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: viewer  # custom
rules:
  - apiGroups: ["*"]
    resources: ["deployments", "configmaps", "pods", "secrets", "services"]
    verbs: ["get", "list", "watch"]
---
# Binding to my-viewer K8s group
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: my-viewer-binding
roleRef:
  kind: ClusterRole
  name: viewer
  apiGroup: rbac.authorization.k8s.io
subjects:
  - kind: Group
    name: my-viewer
    apiGroup: rbac.authorization.k8s.io

```

```hcl
resource "aws_iam_user" "developer" {
  name = "developer"
}

# Minimal set to connect to the cluster
resource "aws_iam_policy" "developer_eks" {
  name = "AmazonEKSDeveloperPolicy"

  policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "eks:DescribeCluster",
                "eks:ListClusters"
            ],
            "Resource": "*"
        }
    ]
}
POLICY
}

resource "aws_iam_user_policy_attachment" "developer_eks" {
  user       = aws_iam_user.developer.name
  policy_arn = aws_iam_policy.developer_eks.arn
}

# Binding IAM user to EKS RBAC group
resource "aws_eks_access_entry" "developer" {
  cluster_name      = aws_eks_cluster.eks.name
  principal_arn     = aws_iam_user.developer.arn
  kubernetes_groups = ["my-viewer"]
}
```

### Cluster admin

```yaml
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: my-admin-binding
roleRef:
  kind: ClusterRole
  name: cluster-admin  # default admin (existing)
  apiGroup: rbac.authorization.k8s.io
subjects:
  - kind: Group
    name: my-admin
    apiGroup: rbac.authorization.k8s.io
```

```hcl
data "aws_caller_identity" "current" {}

resource "aws_iam_role" "eks_admin" {
  name = "${local.env}-${local.eks_name}-eks-admin"

  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Principal": {
        "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" # this way all users from this account can assume this role
      }
    }
  ]
}
POLICY
}

resource "aws_iam_policy" "eks_admin" {
  name = "AmazonEKSAdminPolicy"

  policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "eks:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": "iam:PassRole",
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "iam:PassedToService": "eks.amazonaws.com"
                }
            }
        }
    ]
}
POLICY
}

resource "aws_iam_role_policy_attachment" "eks_admin" {
  role       = aws_iam_role.eks_admin.name
  policy_arn = aws_iam_policy.eks_admin.arn
}

resource "aws_iam_user" "manager" {
  name = "manager"
}

resource "aws_iam_policy" "eks_assume_admin" {
  name = "AmazonEKSAssumeAdminPolicy"

  policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sts:AssumeRole"
            ],
            "Resource": "${aws_iam_role.eks_admin.arn}"
        }
    ]
}
POLICY
}

resource "aws_iam_user_policy_attachment" "manager" {
  user       = aws_iam_user.manager.name
  policy_arn = aws_iam_policy.eks_assume_admin.arn
}

# Best practice: use IAM roles due to temporary credentials
resource "aws_eks_access_entry" "manager" {
  cluster_name      = aws_eks_cluster.eks.name
  principal_arn     = aws_iam_role.eks_admin.arn
  kubernetes_groups = ["my-admin"]
}
```

Important! To use this credentials as the user with assumed role, new profile must be used with set role_arn and source profile of IAM user:

```toml
[profile eks-admin]
role_arn = arn:aws:iam...:role/staging-demo-eks-admin
source_profile = manager
```

```sh
aws eks update-kubeconfig --region eu-central-1 --name staging-demo --profile eks-admin
```

## Add-on

```sh
aws eks describe-addon-versions --region 'eu-central-1' --addon-name eks-pod-identity-agent
```
