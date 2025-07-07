
# Data will wait until EKS cluster is ready
data "aws_eks_cluster" "eks" {
  name = aws_eks_cluster.eks.name
}

data "aws_eks_cluster_auth" "eks" {
  name = aws_eks_cluster.eks.name
}

# if module, move it to environment directory (root)
provider "helm" {
  kubernetes = {
    host                   = data.aws_eks_cluster.eks.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.eks.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.eks.token # exec block can be used to get the token by aws cli 9'aws eks get token')
  }
}

resource "helm_release" "metrics_server" {
  name = "metrics-server"

  repository = "http://kubernetes-sigs.github.io/metrics-server/"
  chart      = "metrics-server"
  namespace  = "kube-system"
  version    = "3.12.1"

  values = [file("${path.module}/values/metrics-server.yaml")]

    # override variables instead using values file
    #   set {
    #     name = "replicaCount"
    #     value = 1
    #   }
}

# kubectl top requires metrics-server