import { network } from "hardhat";

const contractAddress = "0xcc71bBfe44c62dab3dd25Ed9a5e626e2d8aB76EC"

const getScore = async (
    id: bigint
) => {
    if (id < 0n){
        throw new Error("Invalid id!");
    }

    try {
        const { viem } = await network.connect({
            network: "avalancheFuji",
            chainType: "l1",
        });

        const contract = await viem.getContractAt("StorageScore", contractAddress);

        const score = await contract.read.get([id]);

        console.log("Score retrieved successfully ", score);
        return score;
    }
    catch(error: any){
        console.log("Error: ", error.message);
    }
}


const addScore = async (
    id: bigint,
    player1: string,
    player2: string,
    score1: bigint,
    score2: bigint,
    winner: string
) => {

    if (!player1 || !player2 || !id) {
        throw new Error("Player are required !");
    }
    
    if (score1 < 0n || score2 < 0n){
        throw new Error("Scores must be positive !");
    }

    if (winner !== player1 && winner !== player2) {
        throw new Error("The winner must be one of the two players !");
    }

    try {

        const { viem } = await network.connect({
            network: "avalancheFuji",
            chainType: "l1",
        });

        const contract = await viem.getContractAt("StorageScore", contractAddress);

        const tx = await contract.write.set([
            id,
            player1,
            player2,
            score1,
            score2,
            winner
        ]);

        console.log("Transaction successfully : ", tx);
        return tx;

    } catch(error: any) {
        console.error("Error: ", error.message);
    }
};

export {getScore, addScore};

