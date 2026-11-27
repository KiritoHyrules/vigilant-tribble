import {
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

const maxConcurrent = 4;
const maxPeers = 4096;
const windowMs = 60_000;
const maxAttempts = 12;
type Peer = { attempts: number; until: number; active: boolean };

@Injectable()
export class LoginAdmission {
  private readonly peers = new Map<string, Peer>();
  private inFlight = 0;
  private nextSweep = 0;

  async run<T>(peerAddress: string, check: () => Promise<T>): Promise<T> {
    const now = performance.now();
    if (now >= this.nextSweep) {
      for (const [key, peer] of this.peers) {
        if (!peer.active && peer.until <= now) this.peers.delete(key);
      }
      this.nextSweep = now + windowMs;
    }
    const peer = this.peers.get(peerAddress);
    if (
      peer?.active ||
      (peer && peer.until > now && peer.attempts >= maxAttempts)
    ) {
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (
      this.inFlight >= maxConcurrent ||
      (!peer && this.peers.size >= maxPeers)
    ) {
      throw new ServiceUnavailableException();
    }
    const entry =
      peer && peer.until > now
        ? peer
        : { attempts: 0, until: now + windowMs, active: false };
    this.peers.set(peerAddress, entry);
    entry.active = true;
    entry.attempts++;
    this.inFlight++;
    try {
      return await check();
    } finally {
      this.inFlight--;
      entry.active = false;
    }
  }
}
