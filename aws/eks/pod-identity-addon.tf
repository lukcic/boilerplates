# used to give specific pod permissions to do changes in the aws infrastructure (cluster, ASG, etc)

resource "aws_eks_addon" "pod_identity" {       # daemonset
  cluster_name = aws_eks_cluster.eks.name
  addon_name = "eks-pod-identity-agent"
  addon_version = "v1.2.0-eksbuild.1"
}