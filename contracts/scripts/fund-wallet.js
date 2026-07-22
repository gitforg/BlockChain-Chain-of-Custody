import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const deployer = new ethers.Wallet(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  provider
);
const target = process.argv[2] || "0xd2e5339a2d23245eb0429e340b2dc9c4c04d6f5b";

const bal = await provider.getBalance(target);
console.log(`Current balance of ${target}: ${ethers.formatEther(bal)} ETH`);

if (bal < ethers.parseEther("1")) {
  console.log("Sending 100 ETH...");
  const tx = await deployer.sendTransaction({
    to: target,
    value: ethers.parseEther("100"),
  });
  await tx.wait();
  const newBal = await provider.getBalance(target);
  console.log(`Done! New balance: ${ethers.formatEther(newBal)} ETH`);
} else {
  console.log("Already funded — no ETH transfer needed.");
}
