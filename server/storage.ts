import type { 
  User, 
  InsertUser, 
  Nft, 
  InsertNft, 
  StakingReward, 
  InsertStakingReward,
  FaucetClaim,
  InsertFaucetClaim 
} from "@shared/schema";
import { randomUUID } from "crypto";

class Storage {
  private users = new Map<string, User>();
  private usersByWallet = new Map<string, User>();
  private nfts = new Map<string, Nft>();
  private stakingRewards = new Map<string, StakingReward>();
  private faucetClaims = new Map<string, FaucetClaim>();
  private faucetStats = new Map<string, any>();

  constructor() {
    this.seedData();
  }

  async seedData() {
    // Create some sample NFTs
    for (let i = 1; i <= 10000; i++) {
      const nft: Nft = {
        id: `nft_${i}`,
        name: `Viking Warrior #${i}`,
        description: `A legendary Viking warrior with unique traits and battle scars. This warrior has fought in ${Math.floor(Math.random() * 50) + 1} battles.`,
        image: `/nft-${(i % 10) + 1}.jpg`,
        attributes: [
          { trait_type: "Strength", value: Math.floor(Math.random() * 100) + 1 },
          { trait_type: "Speed", value: Math.floor(Math.random() * 100) + 1 },
          { trait_type: "Intelligence", value: Math.floor(Math.random() * 100) + 1 },
          { trait_type: "Weapon", value: ["Axe", "Sword", "Spear", "Hammer"][Math.floor(Math.random() * 4)] },
          { trait_type: "Armor", value: ["Chainmail", "Leather", "Plate", "Scale"][Math.floor(Math.random() * 4)] },
        ],
        tokenId: i.toString(),
        contractAddress: "0x742d35Cc6637C0532e8E23B3F5cf6D8a2f5D7F87",
        ownerId: i <= 100 ? "user_1" : null,
        isStaked: i === 1,
        stakedAt: i === 1 ? new Date() : null,
        createdAt: new Date(),
      };
      this.nfts.set(nft.id, nft);
    }

    // Create sample user
    const user: User = {
      id: "user_1",
      walletAddress: "0x1234567890123456789012345678901234567890",
      odinBalance: "125.5",
      discordId: "discord_123",
      discordUsername: "VikingWarrior",
      discordVerified: true,
      lastFaucetClaim: null,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    this.usersByWallet.set(user.walletAddress.toLowerCase(), user);

    // Initialize faucet stats
    this.faucetStats.set("global", { 
      totalClaimed: "1500.25", 
      totalClaimers: 42,
      claimsToday: 8 
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    return this.usersByWallet.get(walletAddress.toLowerCase());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    this.usersByWallet.set(user.walletAddress.toLowerCase(), user);
    return user;
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser = { ...user, odinBalance: newBalance };
    this.users.set(userId, updatedUser);
    this.usersByWallet.set(user.walletAddress.toLowerCase(), updatedUser);
    return updatedUser;
  }

  async updateUserDiscord(userId: string, discordId: string, discordUsername: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser = { ...user, discordId, discordUsername, discordVerified: true };
    this.users.set(userId, updatedUser);
    this.usersByWallet.set(user.walletAddress.toLowerCase(), updatedUser);
    return updatedUser;
  }

  // NFT methods
  async getNfts(limit: number, offset: number): Promise<Nft[]> {
    const allNfts = Array.from(this.nfts.values());
    return allNfts.slice(offset, offset + limit);
  }

  async getNft(id: string): Promise<Nft | undefined> {
    return this.nfts.get(id);
  }

  async getNftsByOwner(ownerId: string): Promise<Nft[]> {
    return Array.from(this.nfts.values()).filter(nft => nft.ownerId === ownerId);
  }

  async getStakedNftsByOwner(ownerId: string): Promise<Nft[]> {
    return Array.from(this.nfts.values()).filter(nft => nft.ownerId === ownerId && nft.isStaked);
  }

  async stakeNft(id: string): Promise<Nft | undefined> {
    const nft = this.nfts.get(id);
    if (!nft) return undefined;

    const stakedNft = { ...nft, isStaked: true, stakedAt: new Date() };
    this.nfts.set(id, stakedNft);
    return stakedNft;
  }

  async unstakeNft(id: string): Promise<Nft | undefined> {
    const nft = this.nfts.get(id);
    if (!nft) return undefined;

    const unstakedNft = { ...nft, isStaked: false, stakedAt: null };
    this.nfts.set(id, unstakedNft);
    return unstakedNft;
  }

  // Staking reward methods
  async getStakingReward(userId: string, nftId: string): Promise<StakingReward | undefined> {
    return this.stakingRewards.get(`${userId}_${nftId}`);
  }

  async createStakingReward(insertReward: InsertStakingReward): Promise<StakingReward> {
    const id = randomUUID();
    const reward: StakingReward = {
      ...insertReward,
      id,
      lastClaimAt: new Date(),
      createdAt: new Date(),
    };
    this.stakingRewards.set(`${insertReward.userId}_${insertReward.nftId}`, reward);
    return reward;
  }

  async updateStakingReward(userId: string, nftId: string, rewardsEarned: string): Promise<StakingReward | undefined> {
    const key = `${userId}_${nftId}`;
    const reward = this.stakingRewards.get(key);
    if (!reward) return undefined;

    const updatedReward = {
      ...reward,
      rewardsEarned,
      lastClaimAt: new Date(),
    };
    this.stakingRewards.set(key, updatedReward);
    return updatedReward;
  }

  // Faucet methods
  async getLastFaucetClaim(userId: string): Promise<FaucetClaim | undefined> {
    return Array.from(this.faucetClaims.values())
      .filter(claim => claim.userId === userId)
      .sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime())[0];
  }

  async createFaucetClaim(insertClaim: InsertFaucetClaim): Promise<FaucetClaim> {
    const id = randomUUID();
    const claim: FaucetClaim = {
      ...insertClaim,
      id,
      claimedAt: new Date(),
    };
    this.faucetClaims.set(id, claim);

    // Update faucet stats
    const currentStats = this.faucetStats.get("global") || { totalClaimed: "0", totalClaimers: 0 };
    const claimAmount = parseFloat(insertClaim.amount);
    const newTotalClaimed = (parseFloat(currentStats.totalClaimed) + claimAmount).toString();

    // Check if this is a new claimer
    const existingClaims = Array.from(this.faucetClaims.values()).filter(c => c.userId === insertClaim.userId);
    const isNewClaimer = existingClaims.length <= 1;
    const newTotalClaimers = currentStats.totalClaimers + (isNewClaimer ? 1 : 0);

    this.faucetStats.set("global", { 
      totalClaimed: newTotalClaimed, 
      totalClaimers: newTotalClaimers,
      claimsToday: currentStats.claimsToday + 1
    });

    return claim;
  }

  async updateLastFaucetClaim(userId: string, claimTime: Date): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser = { ...user, lastFaucetClaim: claimTime };
    this.users.set(userId, updatedUser);
    this.usersByWallet.set(user.walletAddress.toLowerCase(), updatedUser);
    return updatedUser;
  }

  async getFaucetStats() {
    return this.faucetStats.get("global") || { totalClaimed: "0", totalClaimers: 0, claimsToday: 0 };
  }

  async getGlobalStats() {
    const allNfts = Array.from(this.nfts.values());
    const stakedNfts = allNfts.filter(nft => nft.isStaked);
    const uniqueOwners = new Set(allNfts.map(nft => nft.ownerId).filter(Boolean));
    const allRewards = Array.from(this.stakingRewards.values());

    const faucetStats = this.faucetStats.get("global") || { totalClaimed: "0", totalClaimers: 0 };

    return {
      totalNfts: allNfts.length,
      totalStaked: stakedNfts.length,
      totalHolders: uniqueOwners.size,
      totalRewardsDistributed: allRewards.reduce((sum, reward) => sum + parseFloat(reward.rewardsEarned || "0"), 0).toString(),
      totalFaucetClaimed: faucetStats.totalClaimed,
      totalFaucetClaimers: faucetStats.totalClaimers,
    };
  }
}

export const storage = new Storage();