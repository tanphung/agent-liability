export function getWalletProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  const providers = window.ethereum?.providers;
  const okxProvider = providers?.find((provider) => provider.isOkxWallet || provider.isOKExWallet);
  if (okxProvider) {
    return okxProvider;
  }

  if (window.ethereum) {
    return window.ethereum;
  }

  if (window.okxwallet?.ethereum) {
    return window.okxwallet.ethereum;
  }

  return window.okxwallet ?? null;
}
