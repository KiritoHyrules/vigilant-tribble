export function loopbackHost(host: string): boolean {
  return ['localhost', '127.0.0.1', '[::1]'].includes(host.toLowerCase());
}

export function loopbackPeer(address: string | undefined): boolean {
  return (
    address === '127.0.0.1' ||
    address === '::1' ||
    address === '::ffff:127.0.0.1'
  );
}
