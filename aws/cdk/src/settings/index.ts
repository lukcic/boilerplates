import * as dotenv from 'dotenv';

export interface Settings {
  vpcCidr: string;
}

export function loadSettings(): Settings {
  dotenv.config();

  const vpcCidr = process.env.VPC_CIDR || '10.0.0.0/16';

  return { vpcCidr };
}
