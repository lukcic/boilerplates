import * as dotenv from 'dotenv';

export interface Settings {
  projectName: string;
  vpcCidr: string;
  privateSubnetCidr: string;
}

export function loadSettings(): Settings {
  dotenv.config();

  const projectName = process.env.PROJECT_NAME || '';
  const vpcCidr = process.env.VPC_CIDR || '10.10.0.0/16';
  const privateSubnetCidr = process.env.PRV_SUBNET_CIDR || '10.10.0.0/24';

  return { projectName, vpcCidr, privateSubnetCidr };
}
