from aws_cdk import (
    Stack,
    aws_ec2
)
from aws_cdk.aws_ec2 import Vpc
from constructs import Construct

class VpcStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.vpc = Vpc(self, 'vpc', max_azs=2, vpc_name='test', ip_addresses=aws_ec2.IpAddresses.cidr("10.10.0.0/16"))

