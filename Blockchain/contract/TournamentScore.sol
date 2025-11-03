pragma solidity >=0.7.0 <0.9.0;

contract StorageScore {

    struct Score{
        string player1;
        string player2;
        uint256 player_score1;
        uint256 player_score2;
        string winner;
    }

    Score public tournamentScore;
    

    function get() public view returns (Score memory){
        return tournamentScore;
    }

    function set(
        string memory player1,
        string memory player2,
        uint256 score_player1,
        uint256 score_player2,
        string memory winner
        ) public {
            tournamentScore = Score({
                player1: player1,
                player2: player2,
                player_score1: score_player1,
                player_score2: score_player2,
                winner: winner
            });
        }
}