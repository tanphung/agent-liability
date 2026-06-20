interface EthereumProvider {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
  providers?: EthereumProvider[];
  isOkxWallet?: boolean;
  isOKExWallet?: boolean;
  ethereum?: EthereumProvider;
}

interface Window {
  ethereum?: EthereumProvider;
  okxwallet?: EthereumProvider;
}
