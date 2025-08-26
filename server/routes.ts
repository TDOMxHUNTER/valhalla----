
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFaucetClaimSchema } from "@shared/schema";
import { z } from "zod";
import { ethers } from "ethers";

// Initialize provider and wallet for Monad Testnet
const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz/");
const faucetWallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get global stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getGlobalStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get NFTs with pagination and filtering
  app.get("/api/nfts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const nfts = await storage.getNfts(limit, offset);
      res.json(nfts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch NFTs" });
    }
  });

  // Get single NFT
  app.get("/api/nfts/:id", async (req, res) => {
    try {
      const nft = await storage.getNft(req.params.id);
      if (!nft) {
        return res.status(404).json({ message: "NFT not found" });
      }
      res.json(nft);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch NFT" });
    }
  });

  // Get user's NFTs
  app.get("/api/users/:userId/nfts", async (req, res) => {
    try {
      const nfts = await storage.getNftsByOwner(req.params.userId);
      res.json(nfts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user NFTs" });
    }
  });

  // Get user's staked NFTs
  app.get("/api/users/:userId/staked", async (req, res) => {
    try {
      const stakedNfts = await storage.getStakedNftsByOwner(req.params.userId);
      
      const nftsWithRewards = await Promise.all(
        stakedNfts.map(async (nft) => {
          const reward = await storage.getStakingReward(req.params.userId, nft.id);
          return {
            ...nft,
            earnedRewards: reward?.rewardsEarned || "0",
            daysSinceStaked: nft.stakedAt ? 
              Math.floor((Date.now() - nft.stakedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0
          };
        })
      );
      
      res.json(nftsWithRewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staked NFTs" });
    }
  });

  // Stake NFT
  app.post("/api/nfts/:id/stake", async (req, res) => {
    try {
      const nft = await storage.stakeNft(req.params.id);
      if (!nft) {
        return res.status(404).json({ message: "NFT not found" });
      }

      if (nft.ownerId) {
        const existingReward = await storage.getStakingReward(nft.ownerId, nft.id);
        if (!existingReward) {
          await storage.createStakingReward({
            userId: nft.ownerId,
            nftId: nft.id,
            rewardsEarned: "0",
          });
        }
      }

      res.json({ message: "NFT staked successfully", nft });
    } catch (error) {
      res.status(500).json({ message: "Failed to stake NFT" });
    }
  });

  // Unstake NFT
  app.post("/api/nfts/:id/unstake", async (req, res) => {
    try {
      const nft = await storage.unstakeNft(req.params.id);
      if (!nft) {
        return res.status(404).json({ message: "NFT not found" });
      }
      res.json({ message: "NFT unstaked successfully", nft });
    } catch (error) {
      res.status(500).json({ message: "Failed to unstake NFT" });
    }
  });

  // Claim staking rewards
  app.post("/api/users/:userId/claim-rewards", async (req, res) => {
    try {
      const stakedNfts = await storage.getStakedNftsByOwner(req.params.userId);
      let totalRewards = 0;

      for (const nft of stakedNfts) {
        const reward = await storage.getStakingReward(req.params.userId, nft.id);
        if (reward) {
          totalRewards += parseFloat(reward.rewardsEarned || "0");
          await storage.updateStakingReward(req.params.userId, nft.id, "0");
        }
      }

      const user = await storage.getUser(req.params.userId);
      if (user) {
        const newBalance = (parseFloat(user.odinBalance || "0") + totalRewards).toString();
        await storage.updateUserBalance(req.params.userId, newBalance);
      }

      res.json({ 
        message: "Rewards claimed successfully", 
        amount: totalRewards.toString(),
        newBalance: user ? (parseFloat(user.odinBalance || "0") + totalRewards).toString() : "0"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to claim rewards" });
    }
  });

  // Discord OAuth verification
  app.post("/api/discord/verify", async (req, res) => {
    try {
      const { walletAddress, discordCode } = req.body;
      
      if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
        return res.status(500).json({ message: "Discord configuration missing" });
      }

      // Exchange Discord code for user info
      const discordTokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID,
          client_secret: process.env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: discordCode,
          redirect_uri: process.env.DISCORD_REDIRECT_URI || `${req.protocol}://${req.get('host')}/faucet`,
        }),
      });

      if (!discordTokenResponse.ok) {
        return res.status(400).json({ message: "Invalid Discord authorization code" });
      }

      const tokenData = await discordTokenResponse.json();
      
      // Get Discord user info
      const discordUserResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const discordUser = await discordUserResponse.json();

      // Check if user is in the Discord server and has required role
      if (process.env.DISCORD_GUILD_ID && process.env.DISCORD_BOT_TOKEN) {
        const guildResponse = await fetch(`https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordUser.id}`, {
          headers: { 
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` 
          },
        });

        if (!guildResponse.ok) {
          return res.status(403).json({ message: "You must be a member of our Discord server to claim from the faucet" });
        }

        const memberData = await guildResponse.json();
        const requiredRoleId = process.env.DISCORD_ROLE_ID;
        
        if (requiredRoleId && !memberData.roles.includes(requiredRoleId)) {
          return res.status(403).json({ message: "You must have the required role in our Discord server to claim from the faucet" });
        }
      }

      // Find or create user by wallet
      let user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        // Create new user
        user = await storage.createUser({
          id: crypto.randomUUID(),
          walletAddress: walletAddress,
          odinBalance: "0",
          discordId: discordUser.id,
          discordUsername: discordUser.username,
          discordVerified: true,
          lastFaucetClaim: null,
          createdAt: new Date(),
        });
      } else {
        // Update existing user
        await storage.updateUserDiscord(user.id, discordUser.id, discordUser.username);
      }

      res.json({ 
        message: "Discord verification successful",
        discordUsername: discordUser.username 
      });
    } catch (error) {
      console.error("Discord verification error:", error);
      res.status(500).json({ message: "Discord verification failed" });
    }
  });

  // Faucet claim with server-side token sending
  app.post("/api/faucet/claim", async (req, res) => {
    try {
      const claimData = insertFaucetClaimSchema.parse(req.body);
      
      // Check if user exists
      let user = await storage.getUserByWallet(claimData.walletAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found. Please verify your Discord first." });
      }

      // Check Discord verification
      if (!user.discordVerified) {
        return res.status(403).json({ message: "Discord verification required to claim from faucet" });
      }

      // Check cooldown (24 hours)
      const lastClaim = await storage.getLastFaucetClaim(user.id);
      if (lastClaim) {
        const timeSinceLastClaim = Date.now() - lastClaim.claimedAt.getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (timeSinceLastClaim < twentyFourHours) {
          const timeLeft = twentyFourHours - timeSinceLastClaim;
          const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
          const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
          
          return res.status(429).json({ 
            message: "Faucet claim on cooldown", 
            timeLeft: `${hoursLeft}h ${minutesLeft}m`
          });
        }
      }

      // Send tokens using server wallet
      const claimAmount = "0.05";
      const amountWei = ethers.parseEther(claimAmount);

      try {
        // Send transaction
        const tx = await faucetWallet.sendTransaction({
          to: claimData.walletAddress,
          value: amountWei,
          gasLimit: 21000,
        });

        // Wait for confirmation
        const receipt = await tx.wait();
        
        if (!receipt || receipt.status !== 1) {
          throw new Error("Transaction failed");
        }

        // Record the claim
        const claim = await storage.createFaucetClaim({
          ...claimData,
          amount: claimAmount,
          userId: user.id,
        });

        // Update user balance and last claim time
        const newBalance = (parseFloat(user.odinBalance || "0") + parseFloat(claimAmount)).toString();
        await storage.updateUserBalance(user.id, newBalance);
        await storage.updateLastFaucetClaim(user.id, new Date());

        res.json({ 
          message: "Tokens sent successfully!", 
          amount: claimAmount,
          newBalance,
          txHash: receipt.hash
        });

      } catch (txError) {
        console.error("Transaction error:", txError);
        return res.status(500).json({ message: "Failed to send tokens. Please try again." });
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Faucet claim error:", error);
      res.status(500).json({ message: "Failed to process faucet claim" });
    }
  });

  // Get faucet stats
  app.get("/api/faucet/stats", async (req, res) => {
    try {
      const stats = await storage.getFaucetStats();
      res.json(stats);
    } catch (error) {
      console.error("Faucet stats error:", error);
      res.status(500).json({ message: "Failed to fetch faucet stats" });
    }
  });

  // Get user by wallet address
  app.get("/api/users/wallet/:address", async (req, res) => {
    try {
      const user = await storage.getUserByWallet(req.params.address);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
