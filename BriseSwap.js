var bigint = require('bigint');
var Web3 = require("web3");
var fs = require('fs');
const path = require('path');
var cronJob = require('cron').CronJob;
const config = require('./config.json');
const bridgeAbi = require('./swapabi.json');
const swapbridgeAbi = require('./nftAbi.json');
const exactMath = require('exact-math');

const CHAIN_ID = config.chainIdBRISE;
const GAS_LIMIT = config.GAS_LIMIT_BRISE;


const OWNER_ADDRESS = config.OWNER_ADDRESS;
const pKey = config.pKey;

const swapContractAddress = config.BRISEContractAddress;
const crossSwapContractAddress = config.BSCContractAddress;

const web3BSC = new Web3(new Web3.providers.HttpProvider(config.connectionURL));
const web3BRISE = new Web3(new Web3.providers.HttpProvider(config.connectionURL1));

const SWAP_INSTANCE = new web3BSC.eth.Contract(bridgeAbi,crossSwapContractAddress);
 

var cronJ1 = new cronJob("*/1 * * * *", async function () {
    checkPending()
}, undefined, true, "GMT");

// var cronJ2 = new cronJob("*/2 * * * *", async function () {
//     SwapRequest()
// }, undefined, true, "GMT");

async function checkPending() {
    fs.readFile(path.resolve(__dirname, 'bscBlock.json'), async (err, blockData) => {
        if (err) {
            console.log(err);
            return;
        }

        blockData = JSON.parse(blockData);
        let lastcheckBlock = blockData["lastblock"];
        const latest = await web3BSC.eth.getBlockNumber();
        console.log(lastcheckBlock,latest)
        blockData["lastblock"] = latest;
         
        SWAP_INSTANCE.getPastEvents({},
        {
            fromBlock: lastcheckBlock,
            toBlock: latest // You can also specify 'latest'          
        })
        .then(async function (resp) {
            for (let i = 0; i < resp.length; i++) {
                if (resp[i].event === "BurnNFT") {
                    console.log("burn nft emitted");
                    let isAlreadyProcessed = false;
                    if(resp[i].returnValues.nonce) {
                        isAlreadyProcessed = await CROSS_SWAP_INSTANCE.methods.nonceProcessed(resp[i].returnValues.nonce).call();
                    }
                    console.log(resp[i].returnValues[1]);
                    console.log(isAlreadyProcessed);
                    console.log(resp[i].returnValues.nonce);
                    !isAlreadyProcessed && SwapRequest(resp[i].returnValues[0],resp[i].returnValues[2]);
                }
            }
            fs.writeFile(path.resolve(__dirname, './bscBlock.json'), JSON.stringify(blockData), (err) => {
                if (err);
                console.log(err);
            });
        })
        .catch((err) => console.error(err));
    });
}


async function SwapRequest(to,tokenURI){
    try 
    {  
       var contractAddress = swapContractAddress;
       var gasLimit = GAS_LIMIT;
       var count = await web3BRISE.eth.getTransactionCount(OWNER_ADDRESS);
       var chainId = CHAIN_ID;              
       var contract = await new web3BRISE.eth.Contract(swapbridgeAbi , web3BRISE);
       
       console.log(amount);   
       const txobject = {
           "from": OWNER_ADDRESS,
           "nonce": "0x" + count.toString(16),
           "gasPrice": web3BRISE.utils.toHex(web3BRISE.utils.toWei('10', 'gwei')),
           "gasLimit": gasLimit,
           "to": contractAddress,
           "value":"0x0",
           "data":contract.methods.mintNFT(to,tokenURI).encodeABI(),
           "chainId": chainId    
       }
           
       const signedTx = await web3BRISE.eth.accounts.signTransaction(txobject, pKey);
               
       web3BRISE.eth.sendSignedTransaction(signedTx.rawTransaction, function(error, hash) 
       {
             if (!error) {
               console.log("🎉 The hash of your transaction is: ", hash, "\n ");
             } else {
               console.log("❗Something went wrong while submitting your transaction:", error)
             }
      });
   } 
   catch (err) 
   {
     console.log(err);
   }
    
}

//checkPending();
cronJ1.start();
// cronJ2.start();