pragma solidity ^0.5.8;

contract IssuerRegistry {

    mapping (address => uint) private issuers;
    

    function addIssuer(address _wallet) public {
        require (issuers[_wallet] == 0);
        issuers[_wallet] = block.number;
        emit Trusted(msg.sender, _wallet);
    }
    
    function removeIssuer(address _wallet) public {
        require (issuers[_wallet] == 0);
        issuers[_wallet] = block.number;
        emit Trusted(msg.sender, _wallet);
    }

    function isTrusted(address _wallet) public view returns (bool) {
        return issuers[_wallet];
    }
    
    event Trusted(address truster, address issuer);
}
