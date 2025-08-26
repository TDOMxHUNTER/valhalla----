
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Coins, Shield } from "lucide-react";

const faucetSchema = z.object({
  walletAddress: z.string()
    .min(1, "Wallet address is required")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format"),
});

type FaucetForm = z.infer<typeof faucetSchema>;

export default function Faucet() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [claimStatus, setClaimStatus] = useState<{
    canClaim: boolean;
    timeLeft?: string;
    message: string;
  }>({ canClaim: false, message: "Discord verification required" });
  const [discordVerified, setDiscordVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userBalance, setUserBalance] = useState("0");

  const form = useForm<FaucetForm>({
    resolver: zodResolver(faucetSchema),
    defaultValues: {
      walletAddress: "",
    },
  });

  // Check if there's a Discord code in URL (after OAuth redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state'); // This should be the wallet address
    
    if (code && state) {
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Verify Discord with the code
      verifyDiscordCode(code, state);
    }
  }, []);

  const verifyDiscordCode = async (code: string, walletAddress: string) => {
    try {
      setIsVerifying(true);
      
      const response = await fetch('/api/discord/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discordCode: code,
          walletAddress: walletAddress,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Discord verification failed');
      }

      const data = await response.json();
      setDiscordVerified(true);
      form.setValue("walletAddress", walletAddress);
      setClaimStatus({ canClaim: true, message: "Ready to claim" });
      
      toast({
        title: "Success!",
        description: `Discord verified as ${data.discordUsername}`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Get user data when wallet address changes
  const walletAddress = form.watch("walletAddress");
  const { data: user } = useQuery({
    queryKey: ["/api/users/wallet", walletAddress],
    queryFn: async () => {
      const response = await fetch(`/api/users/wallet/${walletAddress}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch user data');
      }
      return response.json();
    },
    enabled: !!walletAddress && faucetSchema.safeParse({ walletAddress }).success,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Update Discord verification status when user data changes
  useEffect(() => {
    if (user?.discordVerified) {
      setDiscordVerified(true);
      setClaimStatus({ canClaim: true, message: "Ready to claim" });
      setUserBalance(user.odinBalance || "0");
    } else if (user) {
      setDiscordVerified(false);
      setClaimStatus({ canClaim: false, message: "Discord verification required" });
      setUserBalance(user.odinBalance || "0");
    }
  }, [user]);

  // Get faucet stats
  const { data: faucetStats } = useQuery({
    queryKey: ["/api/faucet/stats"],
    queryFn: async () => {
      const response = await fetch("/api/faucet/stats");
      if (!response.ok) {
        return {
          totalClaimed: "0",
          totalClaimers: 0,
          claimsToday: 0
        };
      }
      return response.json();
    },
    refetchInterval: 30000,
    retry: 1,
  });

  // Discord verification mutation
  const discordVerifyMutation = useMutation({
    mutationFn: async () => {
      const walletAddr = form.getValues("walletAddress");
      if (!walletAddr || !faucetSchema.safeParse({ walletAddress: walletAddr }).success) {
        throw new Error("Please enter a valid wallet address first");
      }

      setIsVerifying(true);

      // Start Discord OAuth flow
      const clientId = "1399414587086078023"; // Replace with your Discord app client ID
      const currentUrl = window.location.href.split('?')[0];
      const redirectUri = encodeURIComponent(currentUrl);
      const scope = "identify%20guilds";

      const discordOAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${encodeURIComponent(walletAddr)}`;

      window.location.href = discordOAuthUrl;
    },
    onError: (error: any) => {
      setIsVerifying(false);
      toast({
        title: "Error",
        description: error.message || "Failed to start Discord verification",
        variant: "destructive"
      });
    },
  });

  // Faucet claim mutation
  const faucetMutation = useMutation({
    mutationFn: async (data: FaucetForm) => {
      const response = await fetch("/api/faucet/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to claim tokens" }));
        throw new Error(error.message || "Failed to claim tokens");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: `Successfully sent ${data.amount || '0.05'} MON tokens to your wallet!`,
        variant: "default",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/users/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/faucet/stats"] });

      setClaimStatus({ canClaim: false, message: "Tokens sent successfully! Wait 24 hours for next claim." });
      setUserBalance(data.newBalance || "0");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FaucetForm) => {
    faucetMutation.mutate(data);
  };

  return (
    <section className="py-20 min-h-screen page-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-cinzel font-bold text-4xl md:text-6xl text-white mb-6">
            MON <span className="text-nordic-gold" data-testid="text-faucet-title">Faucet</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto" data-testid="text-faucet-description">
            Claim free MON tokens for testing on Monad Testnet
          </p>
        </div>

        <Card className="bg-viking-dark/90 backdrop-blur-sm border-nordic-gold/30 max-w-2xl mx-auto shadow-2xl">
          <CardContent className="p-8">
            {/* Hero Image */}
            <div className="mb-8 relative rounded-xl overflow-hidden">
              <img
                src="/background.png"
                alt="Aurora borealis over Nordic landscape"
                className="w-full h-48 object-cover"
                data-testid="img-faucet-hero"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-viking-dark to-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-nordic-gold text-6xl animate-float">
                  <Coins className="h-16 w-16" />
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="font-cinzel font-bold text-3xl text-white mb-4">Claim Your MON</h2>
              <p className="text-gray-300 mb-6" data-testid="text-faucet-instructions">
                Get 0.05 free MON tokens every 24 hours for testing purposes
              </p>

              {/* Current Balance Display */}
              <div className="bg-rune-gray rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-400 mb-1">Current Balance</div>
                <div className="text-2xl font-bold text-nordic-gold" data-testid="text-current-balance">
                  {userBalance} MON
                </div>
              </div>
            </div>

            {/* Faucet Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="walletAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-semibold">Wallet Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0x... (Enter your Monad Testnet wallet address)"
                          className="bg-rune-gray border-nordic-gold/30 text-white focus:border-nordic-gold"
                          data-testid="input-wallet-address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Discord Verification Status */}
                <div className={`p-4 rounded-lg border mb-6 ${
                  discordVerified
                    ? 'bg-green-900/20 border-green-500/30'
                    : 'bg-yellow-900/20 border-yellow-500/30'
                }`}>
                  <div className="flex items-center justify-center mb-3">
                    <Shield className={`mr-2 h-5 w-5 ${discordVerified ? 'text-green-400' : 'text-yellow-400'}`} />
                    <span className={discordVerified ? 'text-green-400' : 'text-yellow-400'}>
                      {discordVerified ? '✓ Discord Verified' : '⚠ Discord Verification Required'}
                    </span>
                  </div>
                  {!discordVerified && (
                    <Button
                      type="button"
                      onClick={() => discordVerifyMutation.mutate()}
                      disabled={discordVerifyMutation.isPending || isVerifying}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
                    >
                      {isVerifying || discordVerifyMutation.isPending ? (
                        "Redirecting to Discord..."
                      ) : (
                        "🔐 Verify with Discord"
                      )}
                    </Button>
                  )}
                </div>

                {/* Claim Status */}
                <div className={`p-4 rounded-lg border ${
                  claimStatus.canClaim
                    ? 'bg-green-900/20 border-green-500/30'
                    : 'bg-yellow-900/20 border-yellow-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={claimStatus.canClaim ? 'text-green-400' : 'text-yellow-400'}>
                      {claimStatus.canClaim ? '✓' : '⏱'} {claimStatus.message}
                    </span>
                    {claimStatus.timeLeft && (
                      <span className="text-gray-400 text-sm" data-testid="text-time-left">
                        Next claim in: {claimStatus.timeLeft}
                      </span>
                    )}
                  </div>
                </div>

                {/* Claim Button */}
                <Button
                  type="submit"
                  disabled={faucetMutation.isPending || !claimStatus.canClaim || !discordVerified}
                  className="w-full bg-nordic-gold text-black hover:bg-yellow-500 transition-all transform hover:scale-105 animate-glow font-bold text-lg py-4 rounded-xl disabled:opacity-50"
                  data-testid="button-claim-tokens"
                >
                  {faucetMutation.isPending ? (
                    "Sending Tokens..."
                  ) : !discordVerified ? (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Discord Verification Required
                    </>
                  ) : (
                    <>
                      <Coins className="mr-2 h-5 w-5" />
                      Claim 0.05 MON Tokens
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Faucet Rules */}
            <div className="bg-rune-gray/50 rounded-lg p-4 mt-6">
              <h3 className="font-cinzel font-bold text-white mb-2">Faucet Rules</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Discord verification required</li>
                <li>• Must be member of our Discord server with required role</li>
                <li>• Maximum 0.05 MON per claim</li>
                <li>• 24-hour cooldown between claims</li>
                <li>• Valid Monad Testnet wallet address required</li>
                <li>• Tokens sent directly to your wallet</li>
                <li>• For testing purposes only</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Faucet Stats */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div className="text-center">
            <div className="text-4xl font-cinzel font-bold text-nordic-gold mb-2" data-testid="stat-total-claimed">
              {parseFloat(faucetStats?.totalClaimed || "0").toLocaleString()}
            </div>
            <div className="text-gray-400">Total Tokens Distributed</div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-cinzel font-bold text-nordic-gold mb-2" data-testid="stat-unique-claimers">
              {faucetStats?.totalClaimers?.toLocaleString() || "0"}
            </div>
            <div className="text-gray-400">Unique Claimers</div>
          </div>
        </div>
      </div>
    </section>
  );
}
