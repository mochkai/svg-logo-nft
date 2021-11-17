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
    uint256 private constant MAX_SUPPLY = 10000;
    string private _customBaseURI = "";

    event TokenCreated(uint256 tokenId);
    event TokenUpdated(uint256 tokenId);
    event BaseURIUpdated(string newBaseURI);

    constructor() ERC721("MochkaiSVGToken", "MKST")
    {
      _tokenIds.reset();
    }

    function create() public
    {
      require(_tokenIds.current() < MAX_SUPPLY, "Max supply reached");

      _tokenIds.increment();

      uint256 newItemId = _tokenIds.current();
      _mint(msg.sender, newItemId);

      emit TokenCreated(newItemId);
    }

    function getOwner() public view returns (address)
    {
      return payable(owner());
    }

    function createWithMetadata(string memory _tokenURI) public onlyOwner
    {
      require(_tokenIds.current() < MAX_SUPPLY, "Max supply reached");

      _tokenIds.increment();

      uint256 newItemId = _tokenIds.current();
      _mint(msg.sender, newItemId);
      _setTokenURI(newItemId, _tokenURI);

      emit TokenCreated(newItemId);
    }

    function updateTokenMetadata(uint256 _tokenId, string memory _tokenURI) public onlyOwner
    {
      _setTokenURI(_tokenId, _tokenURI);

      emit TokenUpdated(_tokenId);
    }

    function updateBaseURI(string memory _newURI) public onlyOwner
    {
      _customBaseURI = _newURI;

      emit BaseURIUpdated(_customBaseURI);
    }

    function destroyContract() public payable onlyOwner
    {
      selfdestruct(payable(owner()));
    }

    function getMaxSupply() public pure returns (uint256)
    {
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

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function _baseURI()
      internal
      view
      virtual
      override
      returns (string memory)
    {
      return _customBaseURI;
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