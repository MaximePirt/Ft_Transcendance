// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract StorageScore {
    event TournamentAdded(uint256 indexed id, string player1, string player2, string player3, string player4, string winner);

    struct Score{
        uint256 id;
        string player1;
        string player2;
        string player3;
        string player4;
        uint256 team1;
        uint256 team2;
        string winner;
        bool exists;
    }

    mapping(uint256 => Score) public tournamentScore;
    

    function get(uint256 id) public view returns (Score memory){
        require(tournamentScore[id].exists, "Tournament does not exist!");
        return tournamentScore[id];
    }

    function set(
        uint256 id,
        string memory player1,
        string memory player2,
        string memory player3,
        string memory player4,
        uint256 score_team1,
        uint256 score_team2,
        string memory winner
        ) public {
            tournamentScore[id] = Score({
                id : id,
                player1: player1,
                player2: player2,
                player3: player3,
                player4: player4,
                team1: score_team1,
                team2: score_team2,
                winner: winner,
                exists: true
            });
            emit TournamentAdded(id, player1, player2, player3, player4, winner);
        }
}