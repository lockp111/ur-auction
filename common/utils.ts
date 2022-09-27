import { HardhatNetworkConfig, NetworkConfig, HardhatNetworkAccountConfig } from 'hardhat/types';

export const Sleep = (ms: number) => {
    return new Promise(resole => setTimeout(resole, ms));
}

export const NetworkAccounts = (config: NetworkConfig): string[] => {
    const accounts = ((config as HardhatNetworkConfig).accounts as HardhatNetworkAccountConfig[]);
    return accounts as any as string[];
}

export const Contracts = (network: string) => {
    let TokenAddress, NFTAddress, LogicAddress, URAuctionAddress;
    switch (network) {
        case 'mainnet':
            TokenAddress = '0x05aD6E30A855BE07AfA57e08a4f30d00810a402e';
            NFTAddress = '0xD80EdcF7C73B43852dA39497a6B5E9cbA1Edf39e';
            LogicAddress = '0xa8A10882f9043389b7E0e09bb830bB541a69e3Bb';
            URAuctionAddress = "0";
            break;
        default:
            TokenAddress = '0xa1122A74240d799a21C1B2e6cBD60Fb2c29B10FF';
            NFTAddress = '0x1AacF41Fb84f383ceb4a603c41e3A0D6FB57674b';
            LogicAddress = '0x0750647764992D30Dbd732A93285E97770Aa1CA7';
            URAuctionAddress = '0xB96335594AB595769AfdD105ae9863924F357fF9';
    }
    return { TokenAddress, NFTAddress, LogicAddress, URAuctionAddress }
}