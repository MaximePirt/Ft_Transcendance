const blockchainService = require('../services/blockchainService');


async function getTournamentScore(tournamentId) {
  try {
    const score = await blockchainService.getScore(tournamentId);
    return {
      success: true,
      data: score
    };
  } catch (error) {
    console.error('Controller error:', error);
    throw error;
  }
}


async function saveTournamentScore(scoreData) {
  try {
    const txHash = await blockchainService.addScore(scoreData);

    return {
      success: true,
      transactionHash: txHash,
      explorerUrl: `https://testnet.snowtrace.io/tx/${txHash}`,
      message: 'Score saved successfully on blockchain'
    };
  } catch (error) {
    console.error('Controller error:', error);
    throw error;
  }
}

module.exports = {
  getTournamentScore,
  saveTournamentScore
};
