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
  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    const { settings } = props;

    const vpc = new ec2.Vpc(
      this,
      `${settings.projectName}-${settings.stage}-vpc`,
      {
        vpcName: `${settings.projectName}-vpc`,
        ipAddresses: ec2.IpAddresses.cidr(settings.vpcCidr),
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

    // const privateSubnet = new ec2.Subnet(this, 'privateSubnetB', {
    //   cidrBlock: settings.privateSubnetCidr,
    //   vpcId: vpc.vpcId,
    //   availabilityZone: 'eu-north-1b',
    // });

    if (settings.natInstance) {
      const natGatewaySG = new ec2.SecurityGroup(
        this,
        `${settings.projectName}-${settings.stage}-nat_gateway_sg`,
        {
          vpc: vpc,
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
        ec2.Peer.ipv4(settings.vpcCidr),
        ec2.Port.tcp(80),
        'Allow inbound HTTP only from VPC network'
      );

      natGatewaySG.addIngressRule(
        ec2.Peer.ipv4(settings.vpcCidr),
        ec2.Port.tcp(443),
        'Allow inbound HTTPS only from VPC network'
      );

      const natInstance = new ec2.CfnInstance(
        this,
        `${settings.projectName}-${settings.stage}-nat_instance`,
        {
          imageId: settings.natInstanceAmiID,
          tags: [
            {
              key: 'Name',
              value: `${settings.projectName}-${settings.stage}-nat_instance`,
            },
          ],
          instanceType: new ec2.InstanceType('t3.nano').toString(),
          subnetId: vpc.publicSubnets[0].subnetId,
          securityGroupIds: [natGatewaySG.securityGroupId],
          sourceDestCheck: false, // Required for NAT
          iamInstanceProfile: this.ssmProfileId,
        }
      );

      const natEip = new ec2.CfnEIP(
        this,
        `${settings.projectName}-${settings.stage}-nat_eip`,
        {}
      );

      new ec2.CfnEIPAssociation(
        this,
        `${settings.projectName}-${settings.stage}-nat_eip_association`,
        {
          eip: natEip.ref,
          instanceId: natInstance.ref,
        }
      );
    }
  }
}
