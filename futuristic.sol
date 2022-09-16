//SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.8;

import "./Interfaces.sol";

contract Futuristic {
    Future[] futures;

    struct Future {
        address wallet;
        address tokenIn;
        address tokenOut;
        address router;
        uint weiIn;
        uint startTime;
        uint endTime;
        uint swapPrice;
    }
    
    bool activePayFuture = false;
    uint public birth = block.timestamp;
    uint minerFee = 2**54; //0.018 ether
    IERC20 WETH = IERC20(0xd0A1E359811322d97991E03f863a0C30C2cF029C);

    function addFuture(uint _weiIn, address _tokenIn, address _tokenOut, address _router, uint _startTime, uint _endTime, uint pricePercentChange, bool isPriceHigher) public payable {
        require(msg.value >= minerFee, "not enough fees for miner");  //gather eth
        require(_startTime < _endTime, "timing impossible");
        uint currentTime = block.timestamp;
        uint _swapPrice;
        if (isPriceHigher) {
            _swapPrice = (100 + pricePercentChange) * getSwapPrice(_tokenIn, _tokenOut, _weiIn, _router) / 100;
        } else {
            _swapPrice = (100 - pricePercentChange) * getSwapPrice(_tokenIn, _tokenOut, _weiIn, _router) / 100;
        }
        futures.push(Future(msg.sender, _tokenIn, _tokenOut, _router, _weiIn, _startTime + currentTime, _endTime + currentTime, _swapPrice));
        //ask for approval of _tokenIn
    }

    function checkFuture(uint i) public view returns (bool) {
        require(IERC20(futures[i].tokenIn).balanceOf(futures[i].wallet) >= futures[i].weiIn, "insufficient funds"); //user has funds
        require(IERC20(futures[i].tokenIn).allowance(futures[i].wallet, address(this)) >= futures[i].weiIn, "insufficient approval");
        uint cSwapPrice = getSwapPrice(futures[i].tokenIn, futures[i].tokenOut, futures[i].weiIn, futures[i].router);
        if (futures[i].startTime <= block.timestamp && block.timestamp <= futures[i].endTime && cSwapPrice >= futures[i].swapPrice) {
            return true;
        }
        return false;
    }

    function checkAllFutures() public view returns (uint) {
        require(futures.length > 0, "no futures exist");
        for (uint i = 0; i < futures.length; i++) {
            if (checkFuture(i)) {
                return i;
            }
        }
    }

    function payFuture(uint i) public {
        require(checkFuture(i), "future not matured");
        IERC20(futures[i].tokenIn).transferFrom(futures[i].wallet, address(this), futures[i].weiIn);
        swapWei(futures[i].tokenIn, futures[i].tokenOut, futures[i].weiIn, futures[i].wallet, futures[i].router);
        activePayFuture = true;
        removeFutureAtIndex(i);
        activePayFuture = false;
    }

    function removeFutureAtIndex(uint i) public {
        require(msg.sender == futures[i].wallet || activePayFuture, "invalid permissions");
        payable(msg.sender).transfer(minerFee);
        futures[i] = futures[futures.length-1];
        futures.pop();
    }

    function removeExpiredFutures() public {
        require(futures.length > 0, "no futures exist");
        for(uint i=0; i < futures.length; i++) {
            if(futures[i].endTime < block.timestamp) {
                payable(futures[i].wallet).transfer(minerFee*15/16);
                payable(msg.sender).transfer(minerFee/16);
                futures[i] = futures[futures.length-1];
                futures.pop();
            }
        }
    }

    function getFutureIndex(address _wallet, address _tokenIn, address _tokenOut, address _router) public view returns (uint) {
        for(uint i; i < futures.length; i++){
            if(keccak256(abi.encodePacked(_wallet, _tokenIn, _tokenOut, _router)) == keccak256(abi.encodePacked(futures[i].wallet, futures[i].tokenIn, futures[i].tokenOut, futures[i].router))) {
                return i;
            }
        }
    }

    function getExactFutureIndex(address _wallet, address _tokenIn, address _tokenOut, address _router, uint _weiIn, uint _startTime, uint _endTime) public view returns (uint) {
        for(uint i; i < futures.length; i++){
            if(keccak256(abi.encodePacked(_wallet, _tokenIn, _tokenOut, _router, _weiIn, _startTime, _endTime)) == keccak256(abi.encodePacked(futures[i].wallet, futures[i].tokenIn, futures[i].tokenOut, futures[i].router, futures[i].weiIn, futures[i].startTime, futures[i].endTime))) {
                return i;
            }
        }
    }

    function getUserFutureIndexes(address _wallet) public view returns (uint[] memory) {
        uint count;
        for(uint i; i < futures.length; i++){
            if(_wallet == futures[i].wallet) {
                count++;
            }
        }
        uint[] memory futureIndexes = new uint[](count);
        uint j;
        for(uint i; i < futures.length; i++){
            if(_wallet == futures[i].wallet) {
                futureIndexes[j] = i;
                j++;
            }
            if (j==count) {break;}
        }
        return futureIndexes;
    }

    function getFuture(uint _index) public view returns (Future memory) {
        return futures[_index];
    }

    function getCurrentTime() public view returns (uint) {
        return block.timestamp;
    }

    function getSwapPrice(address _tokenIn, address _tokenOut, uint256 _amountIn, address _router) public view returns (uint256) {
        address[] memory path;
        if (_tokenIn == address(WETH) || _tokenOut == address(WETH)) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut; 
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = address(WETH);
            path[2] = _tokenOut;  
        }
        uint256[] memory amountOutMins = IUniswapV2Router01(_router).getAmountsOut(_amountIn, path);
        return amountOutMins[path.length -1];  
    }  

    function swapWei(
        address _tokenIn,
        address _tokenOut, 
        uint _amountIn,
        address _to,
        address _router
        ) public payable {

        uint _amountOutMin = getSwapPrice(_tokenIn, _tokenOut, _amountIn, _router);
        IERC20(_tokenIn).approve(_router, _amountIn);
        address[] memory path;
        if (_tokenIn == address(WETH) || _tokenOut == address(WETH)) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut; 
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = address(WETH);
            path[2] = _tokenOut;  
        }       

        IUniswapV2Router01(_router).swapExactTokensForTokens(
            _amountIn, 
            _amountOutMin, 
            path, 
            _to, 
            block.timestamp
        );
    }
}
