import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

const defaultEnvFilePath: string = path.resolve(__dirname, '../../.env');

const customEnvFilePath: string = path.resolve(
  __dirname,
  `../../.env.${process.env.NODE_ENV}`
);

if (fs.existsSync(defaultEnvFilePath))
  config({ path: defaultEnvFilePath });

if (fs.existsSync(customEnvFilePath))
  config({ path: customEnvFilePath });
