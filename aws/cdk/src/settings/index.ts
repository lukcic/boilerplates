import * as dotenv from 'dotenv';

export interface Settings {
  projectName: string;
  stage: string;
  vpcCidr: string;
  privateSubnetCidr: string;
}

export function loadSettings(): Settings {
  dotenv.config();

  const projectName = process.env.PROJECT_NAME || '';
  const stage = process.env.PROJECT_STAGE || '';
  const vpcCidr = process.env.VPC_CIDR || '10.10.0.0/16';
  const privateSubnetCidr = process.env.PRV_SUBNET_CIDR || '10.10.0.0/24';

  return { projectName, stage, vpcCidr, privateSubnetCidr };
}
