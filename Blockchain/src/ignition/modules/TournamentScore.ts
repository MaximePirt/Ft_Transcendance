import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TournamentScoreModule", (m) => {

    const tournamentScore = m.contract("StorageScore");

    return { tournamentScore };
});