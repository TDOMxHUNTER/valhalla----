import { z } from "zod";

// User schema
export const insertUserSchema = z.object({
  id: z.string(),
  walletAddress: z.string(),
  odinBalance: z.string().optional(),
  discordId: z.string().optional(),
  discordUsername: z.string().optional(),
  discordVerified: z.boolean().default(false),
  lastFaucetClaim: z.date().nullable().optional(),
  createdAt: z.date().optional(),
});

export const userSchema = insertUserSchema.extend({
  createdAt: z.date(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;

// NFT schema
export const insertNftSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  image: z.string(),
  attributes: z.array(z.object({
    trait_type: z.string(),
    value: z.union([z.string(), z.number()]),
  })),
  tokenId: z.string(),
  contractAddress: z.string(),
  ownerId: z.string().nullable(),
  isStaked: z.boolean().default(false),
  stakedAt: z.date().nullable().optional(),
  createdAt: z.date().optional(),
});

export const nftSchema = insertNftSchema.extend({
  createdAt: z.date(),
});

export type InsertNft = z.infer<typeof insertNftSchema>;
export type Nft = z.infer<typeof nftSchema>;

// Staking reward schema
export const insertStakingRewardSchema = z.object({
  userId: z.string(),
  nftId: z.string(),
  rewardsEarned: z.string(),
});

export const stakingRewardSchema = insertStakingRewardSchema.extend({
  id: z.string(),
  lastClaimAt: z.date(),
  createdAt: z.date(),
});

export type InsertStakingReward = z.infer<typeof insertStakingRewardSchema>;
export type StakingReward = z.infer<typeof stakingRewardSchema>;

// Faucet claim schema
export const insertFaucetClaimSchema = z.object({
  userId: z.string(),
  walletAddress: z.string(),
  amount: z.string(),
});

export const faucetClaimSchema = insertFaucetClaimSchema.extend({
  id: z.string(),
  claimedAt: z.date(),
});

export type InsertFaucetClaim = z.infer<typeof insertFaucetClaimSchema>;
export type FaucetClaim = z.infer<typeof faucetClaimSchema>;