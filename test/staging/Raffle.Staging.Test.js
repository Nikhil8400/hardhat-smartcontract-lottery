const { assert, expect } = require("chai")
const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Staging Tests", function () {
          let raffle, raffleEntranceFee, deployer

          beforeEach(async  () =>{
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("fulfillRandomWords",  ()=> {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
                  // enter the raffle
                  console.log("Setting up test...")
                  const startingTimeStamp = await raffle.getLastTimeStamp()
                  const accounts = await ethers.getSigners()

                  console.log("Setting up Listener...")
                  await new Promise(async (resolve, reject) => {
                      // setup listener before we enter the raffle
                      // Just in case the blockchain moves REALLY fast
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              // add our asserts here
                              const recentWinner = await raffle.getRecentWinner()
                              console.log(`Got the recent winner ${recentWinner}`)
                              const raffleState = await raffle.getRaffleState()
                              console.log(`Got the raffle state ${raffleState}`)
                              const winnerEndingBalance = await accounts[0].getBalance()
                              console.log(`Got the winner Ending balance ${winnerEndingBalance}`)
                              const endingTimeStamp = await raffle.getLastTimeStamp()
                              console.log(`Got the ending timestamp ${endingTimeStamp}`)

                              await expect(raffle.getPlayer(0)).to.be.reverted
                              console.log("Passed raffle reset")
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              console.log("passed winner test")
                              assert.equal(raffleState, 0)
                              console.log("passed the raffle state reset test")
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(raffleEntranceFee).toString()
                              )
                              console.log("passed the winner balance test")
                              assert(endingTimeStamp > startingTimeStamp)
                              console.log("time stamp has been reset")
                             
                              resolve()
                              
                              console.log("resolved promise")
                          } catch (error) {
                            console.error("Error:", error.message);
                            console.error("Stack trace:", error.stack);
                            reject(error);
                          }
                      })
                      // Then entering the raffle
                      console.log("Entering Raffle...")
                      const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
                      await tx.wait(1)
                      console.log("Ok, time to wait...")
                      const winnerStartingBalance = await accounts[0].getBalance()

                      // and this code WONT complete until our listener has finished listening!
                  })
              })
          })
      })