// contracts/MochkaiLogo.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MochkaiLogo is ERC721URIStorage, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    uint256 private constant MAX_SUPPLY = 10;

    event TokenCreated(uint256 tokenId);

    constructor() ERC721("MochkaiLogo", "MKL") {
      _tokenIds.reset();
    }

    function create(string memory _tokenURI) public
    {
      require(_tokenIds.current() < MAX_SUPPLY, "Max supply reached");

      _tokenIds.increment();

      uint256 newItemId = _tokenIds.current();
      _mint(msg.sender, newItemId);
      _setTokenURI(newItemId, _tokenURI);

      emit TokenCreated(newItemId);
    }

    function getMaxSupply() public pure returns (uint256) {
      return MAX_SUPPLY;
    }

    function safeMint(address to) public onlyOwner {
        _safeMint(to, _tokenIds.current());
        _tokenIds.increment();
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}