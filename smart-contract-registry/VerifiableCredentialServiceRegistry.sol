pragma solidity ^0.5.8;

contract VerifiableCredentialServiceRegistry {

    // DATA STRUCTURES
    mapping (bytes32 => mapping (address => uint)) private revocations;
    mapping (address => bool) private issuers;


    // METHODS
    function revoke(bytes32 _digest) public {
        require (revocations[_digest][msg.sender] == 0);
        revocations[_digest][msg.sender] = block.number;
        emit Revoked(msg.sender, _digest);
    }
    
    function revoked(address _issuer, bytes32 _digest) public view returns (uint) {
        return revocations[_digest][_issuer];
    }
    
    function addTrusted(address _wallet) public {
        require (issuers[_wallet] == false);
        issuers[_wallet] = true;
        emit Trusted(msg.sender, _wallet);
    }
    
    function removeTrusted(address _wallet) public {
        require (issuers[_wallet] == true);
        issuers[_wallet] = false;
        emit Trusted(msg.sender, _wallet);
    }

    function isTrusted(address _wallet) public view returns (bool) {
        return issuers[_wallet];
    }
    
    event Revoked(address issuer, bytes32 digest);
    event Trusted(address truster, address issuer);
}