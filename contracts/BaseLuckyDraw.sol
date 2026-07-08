// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BaseLuckyDraw {
    uint256 public constant MIN_DURATION = 5 minutes;
    uint256 public constant MAX_DURATION = 14 days;
    uint256 public nextDrawId = 1;

    struct Draw {
        address creator;
        uint256 entryFee;
        uint256 endsAt;
        bool settled;
        address winner;
        string title;
        string note;
        address[] entrants;
    }

    mapping(uint256 => Draw) private draws;
    mapping(uint256 => mapping(address => bool)) private joined;

    event DrawCreated(
        uint256 indexed drawId,
        address indexed creator,
        uint256 entryFee,
        uint256 endsAt,
        string title,
        string note
    );
    event DrawJoined(uint256 indexed drawId, address indexed entrant, uint256 entryFee);
    event DrawSettled(uint256 indexed drawId, address indexed winner, uint256 prize);

    function createDraw(
        string calldata title,
        string calldata note,
        uint256 entryFee,
        uint256 durationSeconds
    ) external returns (uint256 drawId) {
        require(bytes(title).length > 0 && bytes(title).length <= 40, "Invalid title");
        require(bytes(note).length <= 120, "Note too long");
        require(entryFee > 0, "Entry fee required");
        require(durationSeconds >= MIN_DURATION && durationSeconds <= MAX_DURATION, "Invalid duration");

        drawId = nextDrawId++;
        Draw storage draw = draws[drawId];
        draw.creator = msg.sender;
        draw.entryFee = entryFee;
        draw.endsAt = block.timestamp + durationSeconds;
        draw.settled = false;
        draw.winner = address(0);
        draw.title = title;
        draw.note = note;

        emit DrawCreated(
            drawId,
            msg.sender,
            entryFee,
            block.timestamp + durationSeconds,
            title,
            note
        );
    }

    function joinDraw(uint256 drawId) external payable {
        Draw storage draw = draws[drawId];
        require(draw.creator != address(0), "Draw not found");
        require(block.timestamp < draw.endsAt, "Draw ended");
        require(!draw.settled, "Draw settled");
        require(!joined[drawId][msg.sender], "Already joined");
        require(msg.value == draw.entryFee, "Incorrect entry fee");

        joined[drawId][msg.sender] = true;
        draw.entrants.push(msg.sender);

        emit DrawJoined(drawId, msg.sender, msg.value);
    }

    function settleDraw(uint256 drawId) external {
        Draw storage draw = draws[drawId];
        require(draw.creator != address(0), "Draw not found");
        require(block.timestamp >= draw.endsAt, "Draw still active");
        require(!draw.settled, "Draw settled");

        draw.settled = true;

        if (draw.entrants.length == 0) {
            draw.winner = address(0);
            return;
        }

        uint256 seed = uint256(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    block.timestamp,
                    drawId,
                    draw.entrants.length
                )
            )
        );
        uint256 winnerIndex = seed % draw.entrants.length;
        address winner = draw.entrants[winnerIndex];
        draw.winner = winner;

        uint256 prize = draw.entryFee * draw.entrants.length;
        (bool success, ) = payable(winner).call{value: prize}("");
        require(success, "Prize transfer failed");

        emit DrawSettled(drawId, winner, prize);
    }

    function hasJoined(uint256 drawId, address account) external view returns (bool) {
        return joined[drawId][account];
    }

    function getEntrantCount(uint256 drawId) external view returns (uint256) {
        return draws[drawId].entrants.length;
    }

    function getDraw(
        uint256 drawId
    )
        external
        view
        returns (
            address creator,
            uint256 entryFee,
            uint256 endsAt,
            bool settled,
            address winner,
            string memory title,
            string memory note,
            uint256 entrantCount
        )
    {
        Draw storage draw = draws[drawId];
        return (
            draw.creator,
            draw.entryFee,
            draw.endsAt,
            draw.settled,
            draw.winner,
            draw.title,
            draw.note,
            draw.entrants.length
        );
    }
}
