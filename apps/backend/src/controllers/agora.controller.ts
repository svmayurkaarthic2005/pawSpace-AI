import { Request, Response } from 'express';
import { env } from '../config/env';

// ─── Agora Token Generator ────────────────────────────────────────────────────
// Uses agora-token (the successor to agora-access-token)

let RtcTokenBuilder: any = null;
let RtcRole: any = null;

try {
  const agoraToken = require('agora-token');
  RtcTokenBuilder = agoraToken.RtcTokenBuilder;
  RtcRole = agoraToken.RtcRole;
} catch {
  console.warn('[Agora] agora-token not installed. Token generation will return null (Testing mode only).');
}

// ─── POST /agora/token ────────────────────────────────────────────────────────

export const generateAgoraToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelName, uid = 0 } = req.body as { channelName?: string; uid?: number };

    if (!channelName) {
      res.status(400).json({ success: false, message: 'channelName is required' });
      return;
    }

    const appId = env.AGORA_APP_ID;
    const appCertificate = env.AGORA_APP_CERTIFICATE;

    // ── Testing mode: no certificate, return null token ─────────────────────
    if (!appCertificate || !RtcTokenBuilder || !RtcRole) {
      console.log('[Agora] Running in Testing mode — returning null token');
      res.json({
        success: true,
        data: {
          token: null,
          channelName,
          uid,
          appId,
          expiresAt: null,
        },
      });
      return;
    }

    // ── Secured mode: generate signed RTC token ──────────────────────────────
    const expirationSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs,
    );

    res.json({
      success: true,
      data: {
        token,
        channelName,
        uid,
        appId,
        expiresAt: new Date((currentTimestamp + expirationSeconds) * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('[Agora] Token generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Agora token' });
  }
};
