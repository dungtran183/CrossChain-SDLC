// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICd3Token { function mint(address to, uint256 amount) external; }

/// @title Cd3MintGateway — chain-B: mint theo xác nhận t-of-n validator; có pause() và blockActor()
///        để phản ứng R4/R5 của CrossSentry tác động thật on-chain.
/// @notice Cờ `loose` (bản "lỏng") tắt kiểm tra msgId đã xử lý — dùng cho kịch bản replay.
contract Cd3MintGateway {
    ICd3Token public token;
    address public guardian;           // CrossSentry (sau khi con người phê duyệt)
    mapping(address => bool) public isValidator;
    uint256 public threshold;
    bool public paused;
    bool public loose;
    mapping(address => bool) public blocked;
    mapping(bytes32 => bool) public minted;

    event Minted(bytes32 indexed msgId, address indexed actor, address recipient, uint256 amount, uint8 corridor);
    event Paused(address by);
    event Unpaused(address by);
    event ActorBlocked(address indexed actor);

    constructor(address _token, address[] memory vals, uint256 _t, address _guardian) {
        token = ICd3Token(_token);
        for (uint256 i = 0; i < vals.length; i++) isValidator[vals[i]] = true;
        threshold = _t;
        guardian = _guardian;
    }

    modifier onlyGuardian() { require(msg.sender == guardian, "only guardian"); _; }

    function setLoose(bool v) external onlyGuardian { loose = v; }
    function pause() external onlyGuardian { paused = true; emit Paused(msg.sender); }
    function unpause() external onlyGuardian { paused = false; emit Unpaused(msg.sender); }
    function blockActor(address a) external onlyGuardian { blocked[a] = true; emit ActorBlocked(a); }

    function mint(bytes32 msgId, address recipient, uint256 amount, uint8 corridor, bytes[] calldata sigs) external {
        require(!paused, "bridge paused");
        require(!blocked[msg.sender] && !blocked[recipient], "actor blocked");
        if (!loose) require(!minted[msgId], "already minted");
        bytes32 h = keccak256(abi.encodePacked(msgId, recipient, amount, corridor, address(this)));
        bytes32 d = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", h));
        address last = address(0);
        uint256 ok = 0;
        for (uint256 i = 0; i < sigs.length; i++) {
            (bytes32 r, bytes32 s, uint8 v) = (bytes32(sigs[i][0:32]), bytes32(sigs[i][32:64]), uint8(sigs[i][64]));
            address signer = ecrecover(d, v < 27 ? v + 27 : v, r, s);
            require(signer > last, "duplicate signer");
            last = signer;
            if (isValidator[signer] && !blocked[signer]) ok++; // validator bị cô lập (R4) không được tính
        }
        require(ok >= threshold, "below threshold");
        minted[msgId] = true;
        token.mint(recipient, amount);
        emit Minted(msgId, msg.sender, recipient, amount, corridor);
    }
}
