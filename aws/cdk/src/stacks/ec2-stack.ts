import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Settings } from '../settings';
import { IRole } from 'aws-cdk-lib/aws-iam';

export interface Ec2StackProps extends StackProps {
  settings: Settings;
  vpc: ec2.Vpc;
  ssmRole: IRole;
}

export class Ec2Stack extends Stack {
  constructor(scope: Construct, id: string, props: Ec2StackProps) {
    super(scope, id, props);

    const userData = ec2.UserData.forLinux();
    userData.addCommands(`#!/bin/bash -xe`, `apt-get update -y`);

    const sshKeyPair = ec2.KeyPair.fromKeyPairAttributes(
      this,
      `${props.settings.projectName}-${props.settings.stage}-key_pair`,
      {
        keyPairName: `${props.settings.sshKeyPair}`,
      }
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `${props.settings.projectName}-${props.settings.stage}-ec2_instance_sg`,
      {
        vpc: props.vpc,
        description: 'Security group for Ec2 instances',
      }
    );

    const ec2Instance = new ec2.Instance(
      this,
      `${props.settings.projectName}-${props.settings.stage}-ec2_instance`,
      {
        vpc: props.vpc,
        machineImage: new ec2.GenericLinuxImage(
          props.settings.ec2InstanceAmiMap
        ),
        instanceType: new ec2.InstanceType('t3.micro'),
        vpcSubnets: props.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }),
        keyPair: sshKeyPair,
        securityGroup: ec2SecurityGroup,
        userData: userData,
        role: props.ssmRole,
      }
    );
  }
}
