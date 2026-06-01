#!/usr/bin/env node
import { runAgentProof } from '../src/index.js';

const result = await runAgentProof(process.argv.slice(2), process.cwd(), process.env);
process.exitCode = result.exitCode;
