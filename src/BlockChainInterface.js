import Web3 from 'web3/dist/web3.min.js';
import ABI_ERC20 from './contract_data/abis/ABI_ERC20.json';
import ABI_FUTURE from './contract_data/abis/ABI_FUTURE.json';

export default class BlockChainInterface {

  async load() {
      if(window.ethereum) {
        await window.ethereum.request({method: 'eth_requestAccounts'});
        this.web3Obj = new Web3(window.ethereum);
        console.log();
      }
      else {
        alert('no metamask');
      }
      console.log('loaded');
  }   

  async approve(addressContract, addressToken, amt) {
    const addressAccount = (await this.web3Obj.eth.getAccounts())[0];
    const contract = new this.web3Obj.eth.Contract(ABI_ERC20, addressToken);
    try {
      let result = contract.methods.approve(addressContract, amt).send({from: addressAccount});
      console.log(await result);
      return true;
    } catch {
      return false;
    }
  }

  async addFuture(addressContract, weiIn, tokenIn, tokenOut, router, startTime, endTime, pricePercentChange, isPriceHigher) {
    const addressAccount = (await this.web3Obj.eth.getAccounts())[0];
    const contract = new this.web3Obj.eth.Contract(ABI_FUTURE, addressContract);

    let result = await contract.methods.addFuture(weiIn, tokenIn, tokenOut, router, startTime, endTime, pricePercentChange, isPriceHigher).send({from: addressAccount, to: addressContract, value: 2**54});
    console.log(await result);
  }

  async removeFuture(addressContract, index) {
    const addressAccount = (await this.web3Obj.eth.getAccounts())[0];
    const contract = new this.web3Obj.eth.Contract(ABI_FUTURE, addressContract);

    try {
      let f = await contract.methods.getFuture(index).call();
      console.log(await f);
      let fParsed = String(f).split(",");
      if (fParsed[0] == addressAccount) {
        let result = await contract.methods.removeFutureAtIndex(index).send({from: addressAccount});
        console.log(await result);
      } else {
        alert("This future belongs to someone else");
      }
    } catch {
      alert("Future with this ID does not exist");
    }
  }

  async removeExpiredFutures(addressContract) {
    const addressAccount = (await this.web3Obj.eth.getAccounts())[0];
    const contract = new this.web3Obj.eth.Contract(ABI_FUTURE, addressContract);
    try {
      let result = await contract.methods.removeExpiredFutures().send({from: addressAccount});
      console.log(await result);
    } catch {}
  }

  async checkFuture(addressContract, index) {
    const addressAccount = (await this.web3Obj.eth.getAccounts())[0];
    const contract = new this.web3Obj.eth.Contract(ABI_FUTURE, addressContract);
    try {
      let result = await contract.methods.checkFuture(index).call();
      console.log(await result);
      if (result) {
        alert("Execution ready");
        return true;
      } else {
        alert("Future not matured");
        return false;
      }
    } catch {
      alert("Valid future with this ID does not exist");
      return false;
    }
  }

  async checkAllFutures(addressContract) { //add to index.js
    const addressAccount = (await this.web3Obj.eth.getAccounts())[0];
    const contract = new this.web3Obj.eth.Contract(ABI_FUTURE, addressContract);
    let result = await contract.methods.checkAllFutures().call();
    console.log(await result);
    if (await this.checkFuture(addressContract, result)) {
      alert("Future ID " + result + " is ready to claim");
      return await result;
    }  
  }

  async payFuture(addressContract, index) { //add to index.js
    const addressAccount = (await this.web3Obj.eth.getAccounts())[0];
    const contract = new this.web3Obj.eth.Contract(ABI_FUTURE, addressContract);

    let result = await contract.methods.payFuture(index).send({from: addressAccount});
    console.log(await result);
  }

  async getFuture(addressContract, index) {
    const addressAccount = (await this.web3Obj.eth.getAccounts())[0];
    const contract = new this.web3Obj.eth.Contract(ABI_FUTURE, addressContract);
    try {
      let result = await contract.methods.getFuture(index).call();
      console.log(await result);
      let t = await contract.methods.getCurrentTime().call();
      let resultParsed = String(result).split(",");
      let resultViewable = "Wallet: " + resultParsed[0] + "\nToken Input: " + resultParsed[1] + "\nToken Output: " + resultParsed[2] + "\nSwap Router: " + resultParsed[3] + "\nAmount of Tokens Input: " + resultParsed[4] / 10**18 + "\nToken Output Threshold: " + resultParsed[7] / 10**18 + "\nStart Time: " + resultParsed[5] + "\nEnd Time: " + resultParsed[6] + "\nCurrent Time: " + t;
      alert(resultViewable);
    } catch {
      alert("Valid future with this ID does not exist");
    }
  }  

  async getExactFutureIndex(addressContract, tokenIn, tokenOut, router, weiIn, startTime, endTime) {
    const addressAccount = (await this.web3Obj.eth.getAccounts())[0];
    const contract = new this.web3Obj.eth.Contract(ABI_FUTURE, addressContract);
    try {
      let result = await contract.methods.getExactFutureIndex(addressAccount, tokenIn, tokenOut, router, weiIn, startTime, endTime).call();
      console.log(await result);
      return result;
    } catch {
      alert("Future with this ID does not exist");
    }
  }

  async getMyFutureIndexes(addressContract) {
    const addressAccount = (await this.web3Obj.eth.getAccounts())[0];
    const contract = new this.web3Obj.eth.Contract(ABI_FUTURE, addressContract);
    let result = await contract.methods.getUserFutureIndexes(addressAccount).call();
    console.log(await result);
    if (result.length > 0) {
      alert(await result);
    } else {
      alert("No futures found");
    }
  }

  async getMyFutures(addressContract) {
    const addressAccount = (await this.web3Obj.eth.getAccounts())[0];
    const contract = new this.web3Obj.eth.Contract(ABI_FUTURE, addressContract);
    let result = await contract.methods.getUserFutureIndexes(addressAccount).call();
    console.log(await result);
    if (result.length > 0) {
      for (let i = 0; i < result.length; i++) {
        await this.getFuture(addressContract, result[i]);
      }
    } else {
      alert("No futures found");
    }
  }

  async getSwapPrice(addressContract, tokenIn, tokenOut, weiIn, router) {
    const addressAccount = (await this.web3Obj.eth.getAccounts())[0];
    const contract = new this.web3Obj.eth.Contract(ABI_FUTURE, addressContract);
    let result = await contract.methods.getSwapPrice(tokenIn, tokenOut, weiIn, router).call();
    console.log(await result);
  }

}