const { createPublicClient, createWalletClient, http } = require('viem');
const { avalancheFuji } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');
const { CONTRACT_ADDRESS, AVALANCHE_FUJI_RPC } = require('../config/blockchain');
const StorageScoreABI = require('../../abi/StorageScore.json');


const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(AVALANCHE_FUJI_RPC)
});

function getWalletClient() {
  if (!process.env.AVALANCHE_PRIVATE_KEY) {
    throw new Error('AVALANCHE_PRIVATE_KEY not set in environment');
  }

  const account = privateKeyToAccount(`0x${process.env.AVALANCHE_PRIVATE_KEY}`);

  return createWalletClient({
    account,
    chain: avalancheFuji,
    transport: http(AVALANCHE_FUJI_RPC)
  });
}

async function getScore(tournamentId) {
  try {
    const score = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: StorageScoreABI.abi,
      functionName: 'get',
      args: [BigInt(tournamentId)]
    });

    return {
      id: score[0].toString(),
      player1: score[1],
      player2: score[2],
      player3: score[3],
      player4: score[4],
      team1Score: score[5].toString(),
      team2Score: score[6].toString(),
      winner: score[7]
    };
  } catch (error) {
    console.error('Error reading from blockchain:', error);
    throw new Error(`Failed to get score: ${error.message}`);
  }
}


async function addScore(scoreData) {
  const { id, player1, player2, player3, player4, team1Score, team2Score, winner } = scoreData;


  if (!player1 || !player2 || !id) {
    throw new Error('Player1, player2 and id are required');
  }

  if (BigInt(team1Score) < 0n || BigInt(team2Score) < 0n) {
    throw new Error('Scores must be positive');
  }

  if (winner !== 'team1' && winner !== 'team2') {
    throw new Error('Winner must be team1 or team2');
  }

  try {
    const walletClient = getWalletClient();

    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: StorageScoreABI.abi,
      functionName: 'set',
      args: [
        BigInt(id),
        player1,
        player2,
        player3 || '',
        player4 || '',
        BigInt(team1Score),
        BigInt(team2Score),
        winner
      ]
    });

    console.log('Transaction sent:', hash);
    return hash;
  } catch (error) {
    console.error('Error writing to blockchain:', error);
    throw new Error(`Failed to add score: ${error.message}`);
  }
}

module.exports = {
  getScore,
  addScore
};
