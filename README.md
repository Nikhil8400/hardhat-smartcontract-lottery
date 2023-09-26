# Hardhat Smart Contract Lottery

Welcome to the Hardhat Smart Contract Lottery project. This decentralized and fully automated lottery smart contract relies on Chainlink VRF and automated keepers for randomness and seamless operation. Users can participate in the lottery by contributing ethers specified in the contract, and the winner is chosen randomly using Chainlink's Verifiable Random Function (VRF).

## Features

- Fully decentralized lottery system.
- Automatic lottery draws using Chainlink VRF.
- Unit and Staging tests for smart contract functionality.
- Mock contracts for unit tests.
- Easy deployment with Hardhat.
- User-friendly and transparent lottery participation.

## Getting Started

Follow these steps to get your lottery smart contract up and running.

### Prerequisites

Before you begin, ensure you have the following tools and technologies installed:

- [Node.js](https://nodejs.org/)
- [Hardhat](https://hardhat.org/)
- [Chainlink VRF](https://chain.link/)

### Installation

1. Clone the repository:

```
git https://github.com/Nikhil8400/hardhat-smartcontract-lottery.git 
```


2. Navigate to the project directory:

```
cd hardhat-smart-contract-lottery
```
3. Install project dependencies:

```
npm install
````
4. Create a .env file and add your Chainlink VRF key. You can obtain your key from Chainlink:
```
VRF_KEY=your_chainlink_vrf_key
```

## Usage

Deploy the Smart Contract
Use the deployment scripts provided with Hardhat to deploy the lottery smart contract to the Ethereum blockchain. Replace network with your desired network (e.g., mainnet, rinkeby, or localhost).

```

npx hardhat run scripts/deploy.js --network network
```

## Participate in the Lottery

To participate in the lottery, send ethers to the smart contract. The specified amount for participation can be found in the contract's settings.

### Automated Lottery Draw
The lottery draw is automated and occurs at predefined intervals. The winner is randomly chosen using Chainlink VRF.

### Testing
Run both unit and staging tests to ensure the smart contract's functionality:

```
npx hardhat test
```

## Acknowledgments

I would like to express my gratitude to :
- Patrick Collins 
- FreeCodeCamp(FCC)