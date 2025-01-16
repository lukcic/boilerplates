import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Settings } from '../settings';
import { CfnInstanceProfile } from 'aws-cdk-lib/aws-iam';

export interface VpcStackProps extends StackProps {
  settings: Settings;
  ssmProfileId: string;
}

export class VpcStack extends Stack {
  ssmProfileId: string;
  vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(
      this,
      `${props.settings.projectName}-${props.settings.stage}-vpc`,
      {
        vpcName: `${props.settings.projectName}-vpc`,
        ipAddresses: ec2.IpAddresses.cidr(props.settings.vpcCidr),
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'PublicSubnetA',
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: 'PrivateSubnetA',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
        ],
        natGateways: 0,
        availabilityZones: ['eu-north-1a'],
        restrictDefaultSecurityGroup: false,
      }
    );

    if (props.settings.natInstance) {
      const natGatewaySG = new ec2.SecurityGroup(
        this,
        `${props.settings.projectName}-${props.settings.stage}-nat_gateway_sg`,
        {
          vpc: this.vpc,
          allowAllOutbound: false,
          description: 'Security group for Nat instance',
        }
      );

      natGatewaySG.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(80),
        'Allow HTTP everywhere'
      );

      natGatewaySG.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(443),
        'Allow HTTPS everywhere'
      );

      natGatewaySG.addIngressRule(
        ec2.Peer.ipv4(props.settings.vpcCidr),
        ec2.Port.tcp(80),
        'Allow inbound HTTP only from VPC network'
      );

      natGatewaySG.addIngressRule(
        ec2.Peer.ipv4(props.settings.vpcCidr),
        ec2.Port.tcp(443),
        'Allow inbound HTTPS only from VPC network'
      );

      const natInstance = new ec2.CfnInstance(
        this,
        `${props.settings.projectName}-${props.settings.stage}-nat_instance`,
        {
          imageId: props.settings.natInstanceAmiID,
          tags: [
            {
              key: 'Name',
              value: `${props.settings.projectName}-${props.settings.stage}-nat_instance`,
            },
          ],
          instanceType: new ec2.InstanceType('t3.nano').toString(),
          subnetId: this.vpc.publicSubnets[0].subnetId,
          securityGroupIds: [natGatewaySG.securityGroupId],
          sourceDestCheck: false, // Required for NAT
          iamInstanceProfile: props.ssmProfileId,
        }
      );

      const natEip = new ec2.CfnEIP(
        this,
        `${props.settings.projectName}-${props.settings.stage}-nat_eip`,
        {}
      );

      new ec2.CfnEIPAssociation(
        this,
        `${props.settings.projectName}-${props.settings.stage}-nat_eip_association`,
        {
          eip: natEip.ref,
          instanceId: natInstance.ref,
        }
      );
    }
  }
}
