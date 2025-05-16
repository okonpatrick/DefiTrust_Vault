import fs from "fs";
import path from "path";
import hre from "hardhat";
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the TrustChain contract
  const TrustChain = await ethers.getContractFactory("TrustChain");
  const trustChain = await TrustChain.deploy();
  //await trustChain.deployed();
  await trustChain.waitForDeployment(); // .deployed() is deprecated, use .waitForDeployment()
  const contractAddress = trustChain.target; // In ethers v6, the address is on the 'target' property
  console.log("TrustChain deployed to:", contractAddress);

  console.log("TrustChain deployed to(this is not working):", trustChain.address);

  // Update the .env file with the new contract address
  const envFilePath = path.resolve(__dirname, "..", ".env");
  let envContent = fs.readFileSync(envFilePath, "utf8");
  envContent = envContent.replace(/^NEXT_PUBLIC_CONTRACT_ADDRESS=.*$/m, `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  fs.writeFileSync(envFilePath, envContent);
  console.log("Updated .env file with contract address");
  // const envFilePath = path.resolve(__dirname, "../.env");
  
  if (fs.existsSync(envFilePath)) {
    envContent = fs.readFileSync(envFilePath, "utf8");
  }

  // Update the contract address
  if (envContent.includes("NEXT_PUBLIC_CONTRACT_ADDRESS=")) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_CONTRACT_ADDRESS=(.*)/,
      `NEXT_PUBLIC_CONTRACT_ADDRESS=${trustChain.address}`
    );
  } else {
    envContent += `\nNEXT_PUBLIC_CONTRACT_ADDRESS=${trustChain.address}`;
  }

  fs.writeFileSync(envFilePath, envContent);
  console.log("Updated .env file with contract address");

  // Export the contract ABI
  const artifactPath = path.resolve(
    __dirname,
    "../artifacts/contracts/TrustChain.sol/TrustChain.json"
  );
  const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  // Create the directory if it doesn't exist
  const abiDir = path.resolve(__dirname, "../src/abis");
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }
  
  // Write the ABI to a file
  fs.writeFileSync(
    path.resolve(abiDir, "TrustChain.json"),
    JSON.stringify(contractArtifact.abi, null, 2)
  );
  console.log("Exported contract ABI to src/abis/TrustChain.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });