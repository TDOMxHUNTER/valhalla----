
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Coins, Lock, Unlock, TrendingUp, Shield } from "lucide-react";

export default function Stake() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedNft, setSelectedNft] = useState<string | null>(null);

  // Mock user ID - in a real app, this would come from authentication
  const userId = "user_1";

  // Get user's NFTs
  const { data: userNfts = [], isLoading: nftsLoading } = useQuery({
    queryKey: ["/api/users", userId, "nfts"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/nfts`);
      if (!response.ok) {
        throw new Error('Failed to fetch NFTs');
      }
      return response.json();
    },
  });

  // Get user's staked NFTs
  const { data: stakedNfts = [], isLoading: stakedLoading } = useQuery({
    queryKey: ["/api/users", userId, "staked"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/staked`);
      if (!response.ok) {
        throw new Error('Failed to fetch staked NFTs');
      }
      return response.json();
    },
  });

  // Stake NFT mutation
  const stakeMutation = useMutation({
    mutationFn: async (nftId: string) => {
      const response = await fetch(`/api/nfts/${nftId}/stake`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to stake NFT");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "NFT staked successfully! Start earning rewards.",
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "nfts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "staked"] });
      setSelectedNft(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unstake NFT mutation
  const unstakeMutation = useMutation({
    mutationFn: async (nftId: string) => {
      const response = await fetch(`/api/nfts/${nftId}/unstake`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to unstake NFT");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "NFT unstaked successfully!",
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "nfts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "staked"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Claim rewards mutation
  const claimRewardsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${userId}/claim-rewards`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to claim rewards");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Rewards Claimed!",
        description: `Successfully claimed ${data.amount} MON tokens!`,
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "staked"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unstackedNfts = userNfts.filter((nft: any) => !nft.isStaked);
  const totalRewards = stakedNfts.reduce((sum: number, nft: any) => sum + parseFloat(nft.earnedRewards || "0"), 0);

  return (
    <section className="py-20 min-h-screen page-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-cinzel font-bold text-4xl md:text-6xl text-white mb-6">
            Stake Your <span className="text-nordic-gold">Vikings</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Stake your Viking warriors to earn passive MON token rewards and strengthen your army
          </p>
        </div>

        {/* Staking Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-viking-dark/90 backdrop-blur-sm border-nordic-gold/30">
            <CardContent className="p-6 text-center">
              <div className="text-nordic-gold text-4xl mb-2">
                <Coins className="h-12 w-12 mx-auto" />
              </div>
              <div className="text-3xl font-cinzel font-bold text-white mb-2">
                {totalRewards.toFixed(4)}
              </div>
              <div className="text-gray-400">Total Rewards Available</div>
            </CardContent>
          </Card>

          <Card className="bg-viking-dark/90 backdrop-blur-sm border-nordic-gold/30">
            <CardContent className="p-6 text-center">
              <div className="text-nordic-gold text-4xl mb-2">
                <Shield className="h-12 w-12 mx-auto" />
              </div>
              <div className="text-3xl font-cinzel font-bold text-white mb-2">
                {stakedNfts.length}
              </div>
              <div className="text-gray-400">Vikings Staked</div>
            </CardContent>
          </Card>

          <Card className="bg-viking-dark/90 backdrop-blur-sm border-nordic-gold/30">
            <CardContent className="p-6 text-center">
              <div className="text-nordic-gold text-4xl mb-2">
                <TrendingUp className="h-12 w-12 mx-auto" />
              </div>
              <div className="text-3xl font-cinzel font-bold text-white mb-2">
                0.1 MON
              </div>
              <div className="text-gray-400">Daily Reward Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Claim Rewards Section */}
        {stakedNfts.length > 0 && totalRewards > 0 && (
          <div className="mb-16">
            <Card className="bg-viking-dark/90 backdrop-blur-sm border-nordic-gold/30">
              <CardHeader>
                <CardTitle className="font-cinzel text-2xl text-white text-center">
                  Claim Your Rewards
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-bold text-nordic-gold mb-4">
                  {totalRewards.toFixed(4)} MON
                </div>
                <p className="text-gray-300 mb-6">
                  Available rewards from your staked Vikings
                </p>
                <Button
                  onClick={() => claimRewardsMutation.mutate()}
                  disabled={claimRewardsMutation.isPending}
                  className="bg-nordic-gold text-black hover:bg-yellow-500 transition-all transform hover:scale-105 animate-glow font-bold text-lg py-3 px-8 rounded-xl"
                >
                  {claimRewardsMutation.isPending ? (
                    "Claiming..."
                  ) : (
                    <>
                      <Coins className="mr-2 h-5 w-5" />
                      Claim Rewards
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Staked NFTs */}
          <div>
            <h2 className="font-cinzel font-bold text-3xl text-white mb-8 text-center">
              Staked Vikings ({stakedNfts.length})
            </h2>
            
            {stakedLoading ? (
              <div className="text-center text-gray-400 py-12">
                Loading staked NFTs...
              </div>
            ) : stakedNfts.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <Lock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No Vikings staked yet</p>
                <p className="text-sm">Stake your Vikings to start earning rewards!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {stakedNfts.map((nft: any) => (
                  <Card key={nft.id} className="bg-rune-gray/80 backdrop-blur-sm border-nordic-gold/30 hover:border-nordic-gold/60 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-20 h-20 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/nft-placeholder.jpg';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-cinzel font-bold text-white text-lg mb-2">
                            {nft.name}
                          </h3>
                          <div className="flex items-center space-x-4 mb-3">
                            <Badge variant="outline" className="border-green-500/50 text-green-400">
                              <Lock className="h-3 w-3 mr-1" />
                              Staked
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {nft.daysSinceStaked} days staked
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-nordic-gold font-bold">
                              {parseFloat(nft.earnedRewards || "0").toFixed(4)} MON earned
                            </div>
                            <Button
                              onClick={() => unstakeMutation.mutate(nft.id)}
                              disabled={unstakeMutation.isPending}
                              variant="outline"
                              size="sm"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            >
                              <Unlock className="h-4 w-4 mr-1" />
                              Unstake
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Available NFTs to Stake */}
          <div>
            <h2 className="font-cinzel font-bold text-3xl text-white mb-8 text-center">
              Available Vikings ({unstackedNfts.length})
            </h2>
            
            {nftsLoading ? (
              <div className="text-center text-gray-400 py-12">
                Loading NFTs...
              </div>
            ) : unstackedNfts.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No Vikings available to stake</p>
                <p className="text-sm">All your Vikings are already staked or you don't own any yet.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {unstackedNfts.slice(0, 10).map((nft: any) => (
                  <Card key={nft.id} className="bg-rune-gray/80 backdrop-blur-sm border-nordic-gold/30 hover:border-nordic-gold/60 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-20 h-20 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/nft-placeholder.jpg';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-cinzel font-bold text-white text-lg mb-2">
                            {nft.name}
                          </h3>
                          <div className="flex items-center space-x-4 mb-3">
                            <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                              Available
                            </Badge>
                            <span className="text-sm text-gray-400">
                              Token #{nft.tokenId}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-gray-400 text-sm">
                              Earn 0.1 MON daily when staked
                            </div>
                            <Button
                              onClick={() => stakeMutation.mutate(nft.id)}
                              disabled={stakeMutation.isPending}
                              className="bg-nordic-gold text-black hover:bg-yellow-500 transition-all"
                              size="sm"
                            >
                              <Lock className="h-4 w-4 mr-1" />
                              Stake
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Staking Info */}
        <div className="mt-16">
          <Card className="bg-viking-dark/90 backdrop-blur-sm border-nordic-gold/30">
            <CardHeader>
              <CardTitle className="font-cinzel text-2xl text-white text-center">
                How Staking Works
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-nordic-gold text-4xl mb-4">
                    <Lock className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="font-cinzel font-bold text-white text-lg mb-2">
                    Stake Vikings
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Lock your Viking NFTs to start earning passive rewards
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="text-nordic-gold text-4xl mb-4">
                    <Coins className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="font-cinzel font-bold text-white text-lg mb-2">
                    Earn MON
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Receive 0.1 MON tokens daily for each staked Viking
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="text-nordic-gold text-4xl mb-4">
                    <TrendingUp className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="font-cinzel font-bold text-white text-lg mb-2">
                    Compound Growth
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Claim rewards anytime and reinvest for maximum gains
                  </p>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-rune-gray/50 rounded-lg">
                <h4 className="font-cinzel font-bold text-white mb-2">Important Notes:</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Staked NFTs cannot be transferred until unstaked</li>
                  <li>• Rewards accumulate automatically every 24 hours</li>
                  <li>• No minimum staking period required</li>
                  <li>• Unstaking is instant with no penalties</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
