const { network } = require("hardhat")
const fs = require("fs")
const {frontEndContractsFile,frontEndAbiFile } = require("../helper-hardhat-config")



module.exports = async  () =>{
    if (process.env.UPDATE_FRONT_END) {            //we are using updatefrontend variable because always we are not intrested  to deploy this script
        console.log("updating front end........") 
        await updateContractAddresses()
        await updateAbi()
        console.log("Written completed to front end")
    }
}

async function updateAbi(){
    const raffle = await ethers.getContract("Raffle")
    fs.writeFileSync(frontEndAbiFile, raffle.interface.format(ethers.utils.FormatTypes.json))
}

async function updateContractAddresses() {
    const chainId = network.config.chainId.toString()
    const raffle = await ethers.getContract("Raffle")
    const currentAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    if(chainId in currentAddresses){
        if(!currentAddresses[chainId].includes(raffle.address)){
            currentAddresses[chainId].push(raffle.address)
        }
    }else{
        currentAddresses[chainId] = [raffle.address]
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(currentAddresses))
}

module.exports.tags = ["all", "frontend"]
