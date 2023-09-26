const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test", async function () {
          let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, deployer, interval
          const chainId = network.config.chainId

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              // const {deployer} = await getNamedAccounts()
              //   const deployers = await  ethers.getSigners()
              //   deployer = deployers[0]
              await deployments.fixture(["all"]) // We are deploying  with all tags means we are deploying every file
              raffle = await ethers.getContract("Raffle", deployer) // Getting raffle contract and connecting it to deployer
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
              console.log(raffleEntranceFee)
              interval = await raffle.getInterval()
          })
          describe("contructor", () => {
              it("intializes the address of VRFCoordinator contract correct", async function () {
                  const raffleState = await raffle.getRaffleState()
                  const response = await raffle.get_i_vrfCoordinator()
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(interval.toString(), networkConfig[chainId]["keepersUpdateInterval"])
                  assert.equal(response, vrfCoordinatorV2Mock.address)
              })
          })
          describe("enterRaffle", () => {
              it("it revert when you don't pay enough", async function () {
                  await expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle__SendMoreToEnterRaffle"
                  )
              })
              it("records player when they enter", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const playerFromContract = await raffle.getPlayer(0)
                  assert.equal(playerFromContract, deployer)
              })
              it("emit event on enter", async function () {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
                      raffle,
                      "RaffleEnter"
                  )
              })
              it("doesn't allow entrance when raffle is calculating", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  // for a documentation of the methods below, go here: https://hardhat.org/hardhat-network/reference
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  // we pretend to be a keeper for a second
                  await raffle.performUpkeep([]) // changes the state to calculating for our comparison below
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
                      // is reverted as raffle is calculating
                      "Raffle__RaffleNotOpen"
                  )
              })
          })
          describe("checkUpKeep", function () {
              it("returns false if people haven't sent any ETH", async () => {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  console.log(upkeepNeeded)
                  assert.equal(upkeepNeeded, false)
              })
              it("returns false if raffle is'nt open", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  await raffle.performUpkeep([]) //hardhat is smart enough to know that this would be transformed to blank object=>raffle.performUpkeep("0x")
                  const raffleState = await raffle.getRaffleState()
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                  assert.equal(raffleState.toString(), "1")
                  assert.equal(upkeepNeeded, false)
              })
              it("returns flase if enough time has't passed", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                  console.log(upkeepNeeded)
                  assert(!upkeepNeeded)
              })
              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                  assert(upkeepNeeded)
              })
          })
          describe("performUpKeep", () => {
              it("it can only run if checkupkeep is true", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const tx = await raffle.performUpkeep("0x")
                  assert(tx)
              })
              it("reverts when check upkeep is false", async () => {
                  await expect(raffle.performUpkeep("0x")).to.be.revertedWith(
                      `Raffle__UpkeepNotNeeded`
                  )
              })
              it("updates the raffle state, emits an event, and calls the vrf coordinator", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const txResponse = await raffle.performUpkeep("0x")
                  const raffleState = await raffle.getRaffleState()
                  const txReceipt = await txResponse.wait(1)
                  const requestId = txReceipt.events[1].args.requestId
                  assert(requestId.toNumber() > 0)
                  assert(raffleState.toString() == "1")
              })
          })
          describe("fulfillRandomWords", () => {
              beforeEach(async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
              })
              it("can Only be called after performUpKeep", async () => {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
                  ).to.be.revertedWith("nonexistent request")
              })
              //Way to big
              it("picks the winner, reset the lottery, and sends money", async () => {
                  const additionalEntrants = 3
                  const startingAccountIndex = 2 //deployer=0
                  const accounts = await ethers.getSigners()
                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additionalEntrants;
                      i++
                  ) {
                      const accountConnectedRaffle = raffle.connect(accounts[i])
                      await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee })
                  }
                  
                  const startingTimeStamp = await raffle.getLastTimeStamp()
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("Found the event")
                          //listen to this winnerpicked event.. when this event happen do some stuff
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const endingTimeStamp = await raffle.getLastTimeStamp()
                              const numPlayers = await raffle.getNumberOfPlayers()
                              assert.equal(raffleState.toString(), "0")
                              assert.equal(numPlayers.toString(), "0")
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (e) {
                              // raffle.oonce  is the listener

                              reject(e)
                          }
                      })
                      //Settng up the listener
                      //below,we wiill fire the event, and the listener will pick  it up , and resolve
                      try {
                          const txResponse = await raffle.performUpkeep("0x")

                          const txReceipt = await txResponse.wait(1)

                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              //once this fullfillrandomwords will called then it will emit WinnerPicked event then listener will let to know ahh
                              txReceipt.events[1].args.requestId,
                              raffle.address
                          )
                      } catch (e) {
                          reject(e)
                      }
                  })
              })
          })
      })

//Note : callStatic is a read-only operation and will not consume any Ether. It simulates what would happen in a
// transaction, but discards all the state changes when it is done.
