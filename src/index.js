import BlockChainInterface from './BlockChainInterface';
import Addresses from './contract_data/Addresses';

(async () => {
    let bcInterface = new BlockChainInterface();
    await bcInterface.load();

    document.getElementById('addFuture-btn').addEventListener('click', async () => {
        try {
            let weiIn = BigInt(document.getElementById('etherIn-input').value * 10**18);
            let tokenIn = document.getElementById('tokenIn-input').value;
            let tokenOut = document.getElementById('tokenOut-input').value;
            let router = document.getElementById('router-input').value;
            let startTime = await document.getElementById('startTime-input').value;
            let endTime = await document.getElementById('endTime-input').value;
            let pricePercentChange = document.getElementById('priceChange-input').value;
            let isPriceHigher = pricePercentChange > 0;
            if (await startTime < await endTime && await startTime >= 0 && await endTime >= 0 && pricePercentChange >= -100) {
                alert(startTime + " " + endTime);
                if (startTime < endTime) {
                    pricePercentChange = Math.abs(pricePercentChange);
                    await bcInterface.getSwapPrice(Addresses.FUTURE, tokenIn, tokenOut, weiIn, router);
                    bcInterface.addFuture(Addresses.FUTURE, weiIn, tokenIn, tokenOut, router, startTime, endTime, pricePercentChange, isPriceHigher);
                    await bcInterface.approve(Addresses.FUTURE, tokenIn, BigInt(2**128));
                }
            } else {alert("Future creation unsucessful");}
        } catch {
            alert("Future creation unsucessful");
        }
    });

    document.getElementById('removeFuture-btn').addEventListener('click', async () => {
        let index = document.getElementById('index-input').value;
        await bcInterface.removeFuture(Addresses.FUTURE, index);
    });

    document.getElementById('getFuture-btn').addEventListener('click', async () => {
        let index = document.getElementById('index-input').value;
        await bcInterface.getFuture(Addresses.FUTURE, index);
    });

    document.getElementById('getMyFutureIndexes-btn').addEventListener('click', async () => {
        await bcInterface.getMyFutureIndexes(Addresses.FUTURE);
    });

    document.getElementById('getMyFutures-btn').addEventListener('click', async () => {
        await bcInterface.getMyFutures(Addresses.FUTURE);
    });

    document.getElementById('checkFuture-btn').addEventListener('click', async () => {
        let index = document.getElementById('index-input').value;
        await bcInterface.checkFuture(Addresses.FUTURE, index);
    });

    document.getElementById('payNextFuture-btn').addEventListener('click', async () => {
        try {
            let i = await bcInterface.checkAllFutures(Addresses.FUTURE);
            await bcInterface.payFuture(Addresses.FUTURE, i);
        } catch {
            alert("No futures ready for execution");
        }
    });

    document.getElementById('removeExpiredFutures-btn').addEventListener('click', async () => {
        try {
            await bcInterface.removeExpiredFutures(Addresses.FUTURE);
        } catch {
            alert("No futures expired");
        }
    });

})();

