from aws_cdk import (
    Stack,
    aws_ec2
)
from constructs import Construct
from aws_cdk.aws_ec2 import Vpc, SubnetType
import os

class VpcStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, settings: dict, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.vpc = Vpc(
            self, 
            f'vpc-{os.getenv('PROJECT_NAME')}', 
            vpc_name='test', 
            ip_addresses=aws_ec2.IpAddresses.cidr(settings.get("VPC_CIDR", "10.0.0.0/16")), 
            subnet_configuration=[
                { 
                    "cidrMask": 24, 
                    "name": 'PublicSubnetA', 
                    "subnetType": SubnetType.PUBLIC, 
                },
                { 
                    "cidrMask": 24, 
                    "name": 'PrivateSubnetA', 
                    "subnetType": SubnetType.PRIVATE_WITH_EGRESS, 
                },
            ],
            nat_gateways=0,
            availability_zones=["eu-north-1a"],
            restrict_default_security_group=False
        )

