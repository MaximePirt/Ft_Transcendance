import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addScore, getScore } from "../scripts/add-score.js";
import { network } from "hardhat";


const tournoi1 = {
  id: 78n,
  player1: "thomas",
  player2: "bot42",
  score1: 4n,
  score2: 57n,
  winner: "bot42"
}

const tournoi2 = {
  id: 88n,
  player1: "jibril",
  player2: "mohamed",
  score1: 2n,
  score2: 90n,
  winner: "mohamed"
}


describe("scoreter", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  it ("Should add and retrieve tournaments", async function () {
    
    const hash1 = await addScore(
      tournoi1.id,
      tournoi1.player1,
      tournoi1.player2,
      tournoi1.score1,
      tournoi1.score2,
      tournoi1.winner
    );

    await publicClient.waitForTransactionReceipt({ hash: hash1});
    console.log("Tournament added: ", tournoi1);

    const hash2 = await addScore(
      tournoi2.id,
      tournoi2.player1,
      tournoi2.player2,
      tournoi2.score1,
      tournoi2.score2,
      tournoi2.winner
    );

    await publicClient.waitForTransactionReceipt({ hash: hash2});
    console.log("Tournament added: ", tournoi2);

    const stored = await getScore(tournoi2.id);
    
    console.log("Bad test tournament id");
    await getScore(999n);
  });
});

