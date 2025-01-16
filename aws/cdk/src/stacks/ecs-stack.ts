import {
  aws_autoscaling,
  aws_iam as iam,
  Stack,
  StackProps,
} from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Settings } from '../settings';
import {
  AsgCapacityProvider,
  Cluster,
  EcsOptimizedImage,
} from 'aws-cdk-lib/aws-ecs';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';

export interface EcsStackProps extends StackProps {
  settings: Settings;
  vpc: ec2.Vpc;
}

export class EcsStack extends Stack {
  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    const ecsInstanceRole = new iam.Role(
      this,
      `${props.settings.projectName}-${props.settings.stage}-ecs_instance_role`,
      {
        roleName: `${props.settings.projectName}-${props.settings.stage}-ecs_instance_role`,
        assumedBy: new iam.CompositePrincipal(
          new iam.ServicePrincipal('ec2.amazonaws.com')
        ),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonSSMManagedInstanceCore'
          ),
        ],
      }
    );

    const launchTemplateSG = new ec2.SecurityGroup(
      this,
      `${props.settings.projectName}-${props.settings.stage}-asg_launch_template_sg`,
      {
        vpc: props.vpc,
        description: 'Security group for cluster instances',
      }
    );

    const sshKeyPair = ec2.KeyPair.fromKeyPairAttributes(
      this,
      `${props.settings.projectName}-${props.settings.stage}-key_pair`,
      {
        keyPairName: `${props.settings.sshKeyPair}`,
      }
    );

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `${props.settings.projectName}-${props.settings.stage}-asg_launch_template`,
      {
        instanceType: new ec2.InstanceType('t3.large'),
        machineImage: EcsOptimizedImage.amazonLinux2(),
        keyPair: sshKeyPair,
        userData: ec2.UserData.forLinux(),
        role: ecsInstanceRole,
        securityGroup: launchTemplateSG,
      }
    );

    const cluster = new Cluster(
      this,
      `${props.settings.projectName}-${props.settings.stage}-ecs_cluster`,
      {
        vpc: props.vpc,
        containerInsights: false,
      }
    );

    const autoScalingGroup = new AutoScalingGroup(
      this,
      `${props.settings.projectName}-${props.settings.stage}-asg`,
      {
        vpc: props.vpc,
        maxCapacity: props.settings.stage === 'production' ? 2 : 1,
        newInstancesProtectedFromScaleIn: false,
        mixedInstancesPolicy: {
          instancesDistribution: {
            onDemandPercentageAboveBaseCapacity: 100,
          },
          launchTemplate: launchTemplate,
        },
      }
    );

    if (props.settings.stage !== 'production') {
      autoScalingGroup.scaleOnSchedule('PrescaleInTheMorning', {
        schedule: aws_autoscaling.Schedule.cron({
          hour: '6',
          minute: '30',
          weekDay: '1-5',
        }),
        maxCapacity: 2,
        minCapacity: 1,
        desiredCapacity: 1,
        timeZone: 'Europe/Warsaw',
      });

      autoScalingGroup.scaleOnSchedule('AllowDownscalingAtNight', {
        schedule: aws_autoscaling.Schedule.cron({
          hour: '19',
          minute: '00',
          weekDay: '1-5',
        }),
        maxCapacity: 0,
        minCapacity: 0,
        desiredCapacity: 0,
        timeZone: 'Europe/Warsaw',
      });
    }

    const capacityProvider = new AsgCapacityProvider(
      this,
      `${props.settings.projectName}-${props.settings.stage}-asg_capacity_provider`,
      {
        autoScalingGroup,
        enableManagedTerminationProtection:
          props.settings.stage === 'production' ? true : false,
        targetCapacityPercent: 70,
      }
    );

    cluster.addAsgCapacityProvider(capacityProvider);
  }
}
