import { Client, GatewayIntentBits, ActivityType, type Presence } from 'discord.js';

let client: Client | null = null;
const presenceCache = new Map<string, any>();

export function getPresence(userId: string): any {
  return presenceCache.get(userId) || null;
}

export function startBot(): void {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token || token === 'your_bot_token_here') {
    console.log('  Discord Bot: No token configured (set DISCORD_BOT_TOKEN in .env)');
    return;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildMembers,
    ],
  });

  client.on('ready', () => {
    console.log(`  Discord Bot: Logged in as ${client!.user?.tag}`);
  });

  client.on('presenceUpdate', (_old, newPresence) => {
    if (!newPresence.userId) return;
    cachePresence(newPresence);
  });

  client.on('guildMemberAdd', (member) => {
    if (member.presence) {
      cachePresence(member.presence);
    }
  });

  // Initial cache of all guild members
  client.on('ready', () => {
    if (!client) return;
    for (const [, guild] of client.guilds.cache) {
      guild.members.cache.forEach((member) => {
        if (member.presence) {
          cachePresence(member.presence);
        }
      });
    }
    console.log(`  Discord Bot: Cached ${presenceCache.size} user presences`);
  });

  client.login(token).catch((err) => {
    console.error('  Discord Bot: Failed to login:', err.message);
  });
}

function cachePresence(presence: Presence): void {
  const user = presence.user;
  if (!user) return;

  const activities = (presence.activities || []).map((a) => ({
    name: a.name || '',
    type: a.type,
    state: a.state || undefined,
    details: a.details || undefined,
    timestamps: a.timestamps ? {
      start: a.timestamps.start?.getTime() || 0,
      end: a.timestamps.end?.getTime() || undefined,
    } : undefined,
    assets: a.assets ? {
      large_image: a.assets.largeImage || undefined,
      large_text: a.assets.largeText || undefined,
      small_image: a.assets.smallImage || undefined,
      small_text: a.assets.smallText || undefined,
    } : undefined,
    application_id: a.applicationId || undefined,
    party: a.party || undefined,
  }));

  presenceCache.set(user.id, {
    discord_user: {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator || '0',
      avatar: user.avatar,
      global_name: user.globalName || user.username,
    },
    discord_status: presence.status || 'offline',
    activities,
    guilds: client?.guilds.cache.size || 0,
  });
}

export function stopBot(): void {
  if (client) {
    client.destroy();
    client = null;
  }
  presenceCache.clear();
}
