// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract StorageScore {
    event TournamentAdded(uint256 indexed id, string player1, string player2, string winner);

    struct Score{
        uint256 id;
        string player1;
        string player2;
        uint256 player_score1;
        uint256 player_score2;
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
        uint256 score_player1,
        uint256 score_player2,
        string memory winner
        ) public {
            tournamentScore[id] = Score({
                id : id,
                player1: player1,
                player2: player2,
                player_score1: score_player1,
                player_score2: score_player2,
                winner: winner,
                exists: true
            });
            emit TournamentAdded(id, player1, player2, winner);
        }
}